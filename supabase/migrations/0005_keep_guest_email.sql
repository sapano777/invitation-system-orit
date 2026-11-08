-- A guest who registers again with the same phone but leaves the email
-- empty keeps the email from their earlier registration (staff can still
-- edit or remove it). Same function as 0004 otherwise.

-- Registers a guest, or updates their registration if the same phone already
-- registered for this event. Checks happen under a row lock on the event, so
-- two guests can't both take the last seats.
--
-- Returns {"status": "created" | "updated"} or {"error": "not_found" |
-- "closed" | "deadline_passed" | "full", "spots_left"?: n}.
create or replace function public.register_guest(
  p_slug        text,
  p_full_name   text,
  p_phone       text,
  p_email       text,
  p_guest_count integer,
  p_guest_names jsonb,
  p_notes       text,
  p_locale      text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_event        public.events%rowtype;
  v_taken        integer;
  v_inserted     boolean;
begin
  select * into v_event
  from public.events
  where slug = lower(trim(p_slug))
  for update;

  if not found then
    return jsonb_build_object('error', 'not_found');
  end if;

  if not v_event.is_active or v_event.date_time < now() then
    return jsonb_build_object('error', 'closed');
  end if;

  if v_event.rsvp_deadline is not null and v_event.rsvp_deadline < now() then
    return jsonb_build_object('error', 'deadline_passed');
  end if;

  if v_event.max_guests is not null then
    -- Seats taken by everyone else; this phone's previous registration is
    -- being replaced, so it doesn't count.
    select coalesce(sum(guest_count), 0) into v_taken
    from public.registrations
    where event_id = v_event.id and status = 'confirmed' and phone <> p_phone;

    if v_taken + p_guest_count > v_event.max_guests then
      return jsonb_build_object('error', 'full', 'spots_left', greatest(v_event.max_guests - v_taken, 0));
    end if;
  end if;

  insert into public.registrations as r
    (event_id, full_name, phone, email, guest_count, guest_names, notes, status, source, locale)
  values
    (v_event.id, trim(p_full_name), p_phone, nullif(trim(p_email), ''), p_guest_count,
     coalesce(p_guest_names, '[]'::jsonb), nullif(trim(p_notes), ''), 'confirmed', 'self',
     case when p_locale in ('he', 'en') then p_locale else 'he' end)
  on conflict (event_id, phone) do update set
    full_name   = excluded.full_name,
    -- Re-registering without an email keeps the one given before, so the
    -- guest still gets the reminder.
    email       = coalesce(excluded.email, r.email),
    guest_count = excluded.guest_count,
    guest_names = excluded.guest_names,
    notes       = excluded.notes,
    locale      = excluded.locale,
    status      = 'confirmed'
  returning (xmax = 0) into v_inserted;

  return jsonb_build_object('status', case when v_inserted then 'created' else 'updated' end);
end;
$$;


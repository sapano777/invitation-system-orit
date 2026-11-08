-- Stage 2: public invitation page and guest self-registration.
--
-- Guests have no account and no table access. The Next.js server calls these
-- functions with the service role, after its own validation and rate limiting,
-- so they are not exposed to anon/authenticated through the REST API.

-- Public fields of one event, plus how many seats are already taken.
create or replace function public.get_public_event(p_slug text)
returns table (
  id            uuid,
  slug          text,
  title         text,
  event_type    text,
  description   text,
  date_time     timestamptz,
  venue_name    text,
  address       text,
  lat           double precision,
  lng           double precision,
  template_id   text,
  media_url     text,
  primary_color text,
  gift_link_url text,
  rsvp_deadline timestamptz,
  max_guests    integer,
  is_active     boolean,
  updated_at    timestamptz,
  guests_taken  integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    e.id, e.slug, e.title, e.event_type, e.description, e.date_time,
    e.venue_name, e.address, e.lat, e.lng, e.template_id, e.media_url,
    e.primary_color, e.gift_link_url, e.rsvp_deadline, e.max_guests,
    e.is_active, e.updated_at,
    coalesce((
      select sum(r.guest_count)
      from public.registrations r
      where r.event_id = e.id and r.status = 'confirmed'
    ), 0)::integer
  from public.events e
  where e.slug = lower(trim(p_slug));
$$;

revoke all on function public.get_public_event(text) from public, anon, authenticated;
grant execute on function public.get_public_event(text) to service_role;

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
  p_notes       text
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
    (event_id, full_name, phone, email, guest_count, guest_names, notes, status, source)
  values
    (v_event.id, trim(p_full_name), p_phone, nullif(trim(p_email), ''), p_guest_count,
     coalesce(p_guest_names, '[]'::jsonb), nullif(trim(p_notes), ''), 'confirmed', 'self')
  on conflict (event_id, phone) do update set
    full_name   = excluded.full_name,
    email       = excluded.email,
    guest_count = excluded.guest_count,
    guest_names = excluded.guest_names,
    notes       = excluded.notes,
    status      = 'confirmed'
  returning (xmax = 0) into v_inserted;

  return jsonb_build_object('status', case when v_inserted then 'created' else 'updated' end);
end;
$$;

revoke all on function public.register_guest(text, text, text, text, integer, jsonb, text) from public, anon, authenticated;
grant execute on function public.register_guest(text, text, text, text, integer, jsonb, text) to service_role;

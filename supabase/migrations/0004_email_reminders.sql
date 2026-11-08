-- Stage 4: email reminders.

-- An event can have no automatic reminder (null). Otherwise: hours before the
-- event when the reminder email goes out.
alter table public.events alter column reminder_offset_hours drop not null;

-- The language the guest used on the invitation page, so their reminder
-- email is in the same language.
alter table public.registrations
  add column locale text not null default 'he' check (locale in ('he', 'en'));

-- One row per email sent (or attempted).
create table public.email_log (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid references public.events (id) on delete cascade,
  registration_id uuid references public.registrations (id) on delete set null,
  kind            text not null check (kind in ('reminder_auto', 'reminder_manual', 'test')),
  to_email        text not null,
  status          text not null check (status in ('sent', 'failed', 'dry_run')),
  provider        text,
  provider_id     text,
  error           text,
  created_at      timestamptz not null default now()
);

create index email_log_event_idx on public.email_log (event_id, created_at desc);

alter table public.email_log enable row level security;

-- Staff can read the log; rows are written by the server with the service role.
create policy "staff read email log"
  on public.email_log for select
  to authenticated
  using (public.is_staff());

revoke all on public.email_log from anon;

-- register_guest gains p_locale. Drop the old signature so there is one version.
drop function public.register_guest(text, text, text, text, integer, jsonb, text);

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
    email       = excluded.email,
    guest_count = excluded.guest_count,
    guest_names = excluded.guest_names,
    notes       = excluded.notes,
    locale      = excluded.locale,
    status      = 'confirmed'
  returning (xmax = 0) into v_inserted;

  return jsonb_build_object('status', case when v_inserted then 'created' else 'updated' end);
end;
$$;

revoke all on function public.register_guest(text, text, text, text, integer, jsonb, text, text) from public, anon, authenticated;
grant execute on function public.register_guest(text, text, text, text, integer, jsonb, text, text) to service_role;

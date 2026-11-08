-- Stage 0: core schema for events, registrations and staff access.
-- Seating tables (tables, registration_tables) arrive in stage 6.

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Staff: the business's employees.
--
-- Supabase Auth lets anyone with the anon key sign up, so "logged in" is not
-- the same as "works here". Only users listed in this table can read or write
-- business data.
-- ---------------------------------------------------------------------------

create table public.staff (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at   timestamptz not null default now()
);

alter table public.staff enable row level security;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.staff where user_id = auth.uid());
$$;

revoke all on function public.is_staff() from public;
grant execute on function public.is_staff() to authenticated;

create policy "staff can read staff"
  on public.staff for select
  to authenticated
  using (public.is_staff());

-- Run from the SQL Editor after creating the user in Authentication > Users:
--   select public.add_staff('person@example.com', 'Display name');
create or replace function public.add_staff(p_email text, p_display_name text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where lower(email) = lower(trim(p_email));
  if v_user_id is null then
    raise exception 'No auth user with email %', p_email;
  end if;

  insert into public.staff (user_id, display_name)
  values (v_user_id, nullif(trim(p_display_name), ''))
  on conflict (user_id) do update set display_name = excluded.display_name;

  return v_user_id;
end;
$$;

-- Only the SQL Editor / service role may add staff.
revoke all on function public.add_staff(text, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------------

create table public.events (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,63}$'),
  title                 text not null check (length(trim(title)) > 0),
  event_type            text not null default 'private' check (event_type in ('private', 'business')),
  description           text,
  date_time             timestamptz not null,
  venue_name            text,
  address               text,
  lat                   double precision check (lat between -90 and 90),
  lng                   double precision check (lng between -180 and 180),
  template_id           text not null default 'classic',
  media_url             text,
  primary_color         text check (primary_color ~ '^#[0-9a-fA-F]{6}$'),
  gift_link_url         text,
  reminder_offset_hours integer not null default 24 check (reminder_offset_hours >= 0),
  reminder_sent_at      timestamptz,
  rsvp_deadline         timestamptz,
  max_guests            integer check (max_guests > 0),
  created_by            uuid references auth.users (id) on delete set null default auth.uid(),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  is_active             boolean not null default true
);

create index events_date_time_idx on public.events (date_time);

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

alter table public.events enable row level security;

create policy "staff manage events"
  on public.events for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- Registrations
--
-- Guests never touch this table directly. Public registration (stage 2) goes
-- through a security-definer function, so a guest cannot read anyone else's
-- details.
-- ---------------------------------------------------------------------------

create table public.registrations (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events (id) on delete cascade,
  full_name   text not null check (length(trim(full_name)) > 0),
  -- Stored in international format without "+", e.g. 972501234567, so wa.me links work.
  phone       text not null check (phone ~ '^[1-9][0-9]{7,14}$'),
  email       text,
  guest_count integer not null default 1 check (guest_count between 1 and 50),
  guest_names jsonb not null default '[]'::jsonb check (jsonb_typeof(guest_names) = 'array'),
  notes       text,
  status      text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  source      text not null default 'self' check (source in ('self', 'manual')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- One registration per phone per event: registering again updates it.
  constraint registrations_event_phone_key unique (event_id, phone)
);

create trigger registrations_set_updated_at
  before update on public.registrations
  for each row execute function public.set_updated_at();

alter table public.registrations enable row level security;

create policy "staff manage registrations"
  on public.registrations for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- The anon role gets nothing on these tables; RLS would block it anyway, this
-- just removes the grants Supabase adds by default.
revoke all on public.staff, public.events, public.registrations from anon;

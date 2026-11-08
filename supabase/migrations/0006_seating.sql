-- Stage 6: table seating.
--
-- Named event_tables (not "tables", as in the plan) to keep it distinct from
-- database tables in code and conversation. Seating is per registration: a
-- party of four takes four seats at one table.

create table public.event_tables (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events (id) on delete cascade,
  name       text not null check (length(trim(name)) between 1 and 60),
  capacity   integer not null check (capacity between 1 and 200),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint event_tables_event_name_key unique (event_id, name),
  -- Target for the composite key below.
  constraint event_tables_event_id_key unique (event_id, id)
);

create index event_tables_event_idx on public.event_tables (event_id, sort_order);

-- Lets registration_tables reference (event_id, id) of a registration.
alter table public.registrations
  add constraint registrations_event_id_id_key unique (event_id, id);

-- One table per registration. The composite foreign keys guarantee the
-- registration and the table belong to the same event.
create table public.registration_tables (
  registration_id uuid primary key,
  event_id        uuid not null,
  table_id        uuid not null,
  assigned_at     timestamptz not null default now(),
  foreign key (event_id, registration_id) references public.registrations (event_id, id) on delete cascade,
  foreign key (event_id, table_id) references public.event_tables (event_id, id) on delete cascade
);

create index registration_tables_table_idx on public.registration_tables (table_id);

alter table public.event_tables enable row level security;
alter table public.registration_tables enable row level security;

create policy "staff manage event tables"
  on public.event_tables for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy "staff manage seating"
  on public.registration_tables for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

revoke all on public.event_tables, public.registration_tables from anon;

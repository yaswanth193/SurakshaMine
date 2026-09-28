

-- ============================================================
-- FILE: supabase\migrations\0001_init.sql
-- ============================================================
-- ============================================================
-- CoalMine — Core schema with role-based, mine-scoped access
-- Run in Supabase SQL editor or: supabase db push
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------
create type user_role as enum ('ADMIN', 'CORPORATE_MANAGEMENT', 'MINE_MANAGER', 'INSPECTOR', 'REGULATORY_AUTHORITY');

create type mine_type as enum ('underground', 'opencast');
create type mine_status as enum ('active', 'inactive', 'maintenance');
create type risk_status as enum ('critical', 'high', 'medium', 'low', 'safe');

create type compliance_status as enum ('overdue', 'urgent', 'pending', 'completed', 'in-progress');
create type compliance_priority as enum ('high', 'medium', 'low', 'critical');
create type compliance_category as enum ('Safety', 'Environment', 'Labour', 'Production', 'Statutory');

create type incident_severity as enum ('low', 'medium', 'high', 'critical');
create type incident_status as enum ('reported', 'investigating', 'action-required', 'resolved', 'closed');

create type inspection_type as enum ('Safety', 'Environment', 'Labour', 'Production', 'Statutory Compliance', 'General');
create type inspection_status as enum ('scheduled', 'in-progress', 'completed', 'pending', 'requires-action', 'closed');

create type location_source as enum ('GPS', 'Fallback');

create type activity_type as enum ('inspection', 'violation', 'compliance', 'alert', 'incident', 'system');

-- ------------------------------------------------------------
-- MINES
-- ------------------------------------------------------------
create table mines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null,
  type mine_type not null default 'underground',
  status mine_status not null default 'active',
  risk_score int not null default 0 check (risk_score between 0 and 100),
  risk_status risk_status not null default 'safe',
  compliance_score int not null default 100 check (compliance_score between 0 and 100),
  workers_on_site int not null default 0,
  last_inspection date,
  zones text[] not null default '{}',   -- e.g. {"Pit Area A","Haul Road A","Workshop A"}
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- PROFILES (extends auth.users) — carries role + mine scoping
-- ------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role user_role not null default 'INSPECTOR',
  mine_id uuid references mines(id) on delete set null,  -- required for MINE_MANAGER
  created_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role, mine_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'INSPECTOR'),
    nullif(new.raw_user_meta_data->>'mine_id', '')::uuid
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Helper: current user's role and mine_id, usable inside RLS policies
create function public.current_role()
returns user_role as $$
  select role from public.profiles where id = auth.uid();
$$ language sql stable security definer;

create function public.current_mine_id()
returns uuid as $$
  select mine_id from public.profiles where id = auth.uid();
$$ language sql stable security definer;

-- ------------------------------------------------------------
-- COMPLIANCE ITEMS
-- ------------------------------------------------------------
create table compliance_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  mine_id uuid not null references mines(id) on delete cascade,
  status compliance_status not null default 'pending',
  priority compliance_priority not null default 'medium',
  category compliance_category not null,
  assigned_to text not null,
  description text not null default '',
  due_date date not null,
  document_name text,
  document_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- INCIDENTS
-- ------------------------------------------------------------
create table incidents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null default 'other',
  mine_id uuid not null references mines(id) on delete cascade,
  zone_name text,
  incident_date date not null default current_date,
  incident_time time not null default current_time,
  severity incident_severity not null default 'medium',
  description text not null default '',
  reported_by text not null,
  immediate_action text,
  root_cause text,
  evidence_url text,             -- Supabase Storage object path
  latitude double precision,
  longitude double precision,
  location_source location_source,
  status incident_status not null default 'reported',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- INSPECTIONS
-- ------------------------------------------------------------
create table inspections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  mine_id uuid not null references mines(id) on delete cascade,
  zone_name text,
  inspection_type inspection_type not null default 'General',
  inspector_name text not null,
  inspection_date date not null default current_date,
  inspection_time time not null default current_time,
  observation text not null default '',
  severity incident_severity not null default 'low',
  evidence_url text,
  latitude double precision,
  longitude double precision,
  location_source location_source,
  remarks text,
  status inspection_status not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- ACTIVITIES (auto-logged notification/audit feed)
-- ------------------------------------------------------------
create table activities (
  id uuid primary key default gen_random_uuid(),
  type activity_type not null,
  message text not null,
  mine_id uuid references mines(id) on delete set null,
  user_name text not null default 'System',
  priority compliance_priority,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- updated_at maintenance
-- ------------------------------------------------------------
create function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_mines_updated_at before update on mines
  for each row execute procedure public.set_updated_at();
create trigger trg_compliance_updated_at before update on compliance_items
  for each row execute procedure public.set_updated_at();
create trigger trg_incidents_updated_at before update on incidents
  for each row execute procedure public.set_updated_at();
create trigger trg_inspections_updated_at before update on inspections
  for each row execute procedure public.set_updated_at();

-- ------------------------------------------------------------
-- Auto-log activity feed entries
-- ------------------------------------------------------------
create function public.log_incident_activity()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    insert into activities (type, message, mine_id, user_name, priority)
    values ('incident', 'New incident reported: ' || new.title, new.mine_id, new.reported_by,
            case new.severity when 'critical' then 'critical' when 'high' then 'high' when 'medium' then 'medium' else 'low' end);
  elsif (tg_op = 'UPDATE' and old.status is distinct from new.status) then
    insert into activities (type, message, mine_id, user_name)
    values ('incident', new.title || ' status changed to ' || new.status, new.mine_id, 'System');
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_incident_activity
  after insert or update on incidents
  for each row execute procedure public.log_incident_activity();

create function public.log_compliance_activity()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    insert into activities (type, message, mine_id, user_name, priority)
    values ('compliance', 'New compliance task: ' || new.title, new.mine_id, new.assigned_to, new.priority);
  elsif (tg_op = 'UPDATE' and old.status is distinct from new.status) then
    insert into activities (type, message, mine_id, user_name)
    values ('compliance', new.title || ' marked ' || new.status, new.mine_id, 'System');
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_compliance_activity
  after insert or update on compliance_items
  for each row execute procedure public.log_compliance_activity();

create function public.log_inspection_activity()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    insert into activities (type, message, mine_id, user_name)
    values ('inspection', 'Inspection scheduled: ' || new.title, new.mine_id, new.inspector_name);
  elsif (tg_op = 'UPDATE' and old.status is distinct from new.status) then
    insert into activities (type, message, mine_id, user_name)
    values ('inspection', new.title || ' is now ' || new.status, new.mine_id, new.inspector_name);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_inspection_activity
  after insert or update on inspections
  for each row execute procedure public.log_inspection_activity();

-- ------------------------------------------------------------
-- INDEXES
-- ------------------------------------------------------------
create index idx_compliance_mine on compliance_items(mine_id);
create index idx_incidents_mine on incidents(mine_id);
create index idx_inspections_mine on inspections(mine_id);
create index idx_activities_mine on activities(mine_id);
create index idx_activities_created on activities(created_at desc);
create index idx_profiles_mine on profiles(mine_id);

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY — this is what enforces the 5-role,
-- mine-scoped access model described in permissions.ts,
-- but at the database layer instead of trusting frontend code.
-- ------------------------------------------------------------
alter table profiles enable row level security;
alter table mines enable row level security;
alter table compliance_items enable row level security;
alter table incidents enable row level security;
alter table inspections enable row level security;
alter table activities enable row level security;

create policy "own profile readable" on profiles
  for select using (auth.uid() = id);
create policy "own profile updatable" on profiles
  for update using (auth.uid() = id);

-- MINES: everyone authenticated can see the mine list (needed for
-- dropdowns etc), but MINE_MANAGER only sees full detail of their own.
-- Simpler + matches your current UI: all roles see all mines' summary data.
create policy "authenticated read mines" on mines
  for select using (auth.role() = 'authenticated');
create policy "admin/corporate write mines" on mines
  for all using (public.current_role() in ('ADMIN', 'CORPORATE_MANAGEMENT'))
  with check (public.current_role() in ('ADMIN', 'CORPORATE_MANAGEMENT'));

-- COMPLIANCE / INCIDENTS / INSPECTIONS:
-- ADMIN, CORPORATE_MANAGEMENT, REGULATORY_AUTHORITY see everything.
-- MINE_MANAGER and INSPECTOR only see rows for their assigned mine_id
-- (INSPECTOR has no mine_id in this schema — adjust if inspectors get
-- assigned to a single mine; currently they see all, matching
-- permissions.ts which gives them cross-mine incident/inspection access).
create policy "scoped read compliance" on compliance_items
  for select using (
    public.current_role() in ('ADMIN', 'CORPORATE_MANAGEMENT', 'REGULATORY_AUTHORITY', 'INSPECTOR')
    or (public.current_role() = 'MINE_MANAGER' and mine_id = public.current_mine_id())
  );
create policy "scoped write compliance" on compliance_items
  for all using (
    public.current_role() in ('ADMIN', 'CORPORATE_MANAGEMENT')
    or (public.current_role() = 'MINE_MANAGER' and mine_id = public.current_mine_id())
  )
  with check (
    public.current_role() in ('ADMIN', 'CORPORATE_MANAGEMENT')
    or (public.current_role() = 'MINE_MANAGER' and mine_id = public.current_mine_id())
  );

create policy "scoped read incidents" on incidents
  for select using (
    public.current_role() in ('ADMIN', 'CORPORATE_MANAGEMENT', 'REGULATORY_AUTHORITY', 'INSPECTOR')
    or (public.current_role() = 'MINE_MANAGER' and mine_id = public.current_mine_id())
  );
create policy "scoped write incidents" on incidents
  for all using (auth.role() = 'authenticated')
  with check (
    public.current_role() in ('ADMIN', 'CORPORATE_MANAGEMENT', 'INSPECTOR')
    or (public.current_role() = 'MINE_MANAGER' and mine_id = public.current_mine_id())
  );

create policy "scoped read inspections" on inspections
  for select using (
    public.current_role() in ('ADMIN', 'CORPORATE_MANAGEMENT', 'REGULATORY_AUTHORITY', 'INSPECTOR')
    or (public.current_role() = 'MINE_MANAGER' and mine_id = public.current_mine_id())
  );
create policy "scoped write inspections" on inspections
  for all using (auth.role() = 'authenticated')
  with check (
    public.current_role() in ('ADMIN', 'CORPORATE_MANAGEMENT', 'INSPECTOR')
    or (public.current_role() = 'MINE_MANAGER' and mine_id = public.current_mine_id())
  );

create policy "scoped read activities" on activities
  for select using (
    public.current_role() in ('ADMIN', 'CORPORATE_MANAGEMENT', 'REGULATORY_AUTHORITY', 'INSPECTOR')
    or (public.current_role() = 'MINE_MANAGER' and (mine_id = public.current_mine_id() or mine_id is null))
  );
create policy "authenticated write activities" on activities
  for insert with check (auth.role() = 'authenticated');

-- ------------------------------------------------------------
-- REALTIME
-- ------------------------------------------------------------
alter publication supabase_realtime add table mines;
alter publication supabase_realtime add table compliance_items;
alter publication supabase_realtime add table incidents;
alter publication supabase_realtime add table inspections;
alter publication supabase_realtime add table activities;


-- ============================================================
-- FILE: supabase\migrations\0002_storage.sql
-- ============================================================
-- ============================================================
-- Storage bucket for incident/inspection evidence + compliance
-- documents. Run after 0001_init.sql.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', false)
on conflict (id) do nothing;

-- Any authenticated user can upload evidence
create policy "authenticated upload evidence"
  on storage.objects for insert
  with check (bucket_id = 'evidence' and auth.role() = 'authenticated');

-- Any authenticated user can read evidence (tighten this to mine-scoped
-- if evidence is sensitive — would require storing mine_id in the
-- object path, e.g. `{mine_id}/{incident_id}/{filename}`, and checking
-- it against current_mine_id() the same way the table policies do)
create policy "authenticated read evidence"
  on storage.objects for select
  using (bucket_id = 'evidence' and auth.role() = 'authenticated');

create policy "uploader can delete own evidence"
  on storage.objects for delete
  using (bucket_id = 'evidence' and auth.uid() = owner);


-- ============================================================
-- FILE: supabase\migrations\0003_push_notifications.sql
-- ============================================================
-- ============================================================
-- CoalMine — Web Push notification subscriptions
-- Lets a Mine Manager send an incident alert to an employee's
-- phone (as a real OS-level push notification) when that
-- employee is marked Present.
-- Run in Supabase SQL editor or: supabase db push
-- ============================================================

-- ------------------------------------------------------------
-- PUSH SUBSCRIPTIONS
-- One row per (employee, device). An employee can enrol more
-- than one device (e.g. phone + tablet) — each gets its own
-- browser Push subscription.
-- employee_id is free text on purpose: the Employees page is
-- still mock/local data (see BACKEND_SETUP.md), so this stores
-- whatever id the frontend already uses (e.g. "EMP-001"). If/when
-- employees move into a real table, add a foreign key here.
-- ------------------------------------------------------------
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  employee_id text not null,
  employee_name text,
  mine_id uuid not null references mines(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth_key text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  unique (employee_id, endpoint)
);

create index idx_push_subscriptions_employee on push_subscriptions(employee_id);
create index idx_push_subscriptions_mine on push_subscriptions(mine_id);

alter table push_subscriptions enable row level security;

-- No public insert/update/delete policy is defined on purpose:
-- the employee-facing enrolment page never talks to Supabase
-- directly. It POSTs to /api/push/subscribe, which runs on the
-- server with the service-role (admin) client and bypasses RLS.
-- Only reads are exposed to normal authenticated sessions, and
-- only within a manager's own mine.
create policy "mine manager reads own mine subscriptions" on push_subscriptions
  for select using (
    public.current_role() in ('ADMIN', 'CORPORATE_MANAGEMENT')
    or (public.current_role() = 'MINE_MANAGER' and mine_id = public.current_mine_id())
  );


-- ============================================================
-- FILE: supabase\migrations\0004_employees.sql
-- ============================================================
-- ============================================================
-- CoalMine — Employees Table with Role & Mine Scoping
-- Run in Supabase SQL editor or: supabase db push
-- ============================================================

create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  mine_id uuid not null references mines(id) on delete cascade,
  name text not null,
  designation text not null,
  phone text not null,
  emergency_name text not null,
  emergency_phone text not null,
  shift text not null default 'Day',
  blood_group text not null default 'O+',
  ppe_status text not null default 'Compliant',
  training_status text not null default 'Certified',
  medical_checkup_date text,
  attendance boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_employees_mine on employees(mine_id);

alter table employees enable row level security;

-- Table privileges
grant usage on schema public to anon, authenticated, service_role;
grant all on table employees to anon, authenticated, service_role;

-- RLS policies
create policy "read employees" on employees
  for select using (
    public.current_role() in ('ADMIN', 'CORPORATE_MANAGEMENT', 'REGULATORY_AUTHORITY', 'INSPECTOR')
    or (public.current_role() = 'MINE_MANAGER' and mine_id = public.current_mine_id())
    or auth.role() = 'anon'
  );

create policy "write employees" on employees
  for all using (
    public.current_role() in ('ADMIN', 'CORPORATE_MANAGEMENT')
    or (public.current_role() = 'MINE_MANAGER' and mine_id = public.current_mine_id())
    or auth.role() = 'authenticated'
  )
  with check (
    public.current_role() in ('ADMIN', 'CORPORATE_MANAGEMENT')
    or (public.current_role() = 'MINE_MANAGER' and mine_id = public.current_mine_id())
    or auth.role() = 'authenticated'
  );

-- Realtime publication
alter publication supabase_realtime add table employees;


-- ============================================================
-- FILE: supabase\seed.sql
-- ============================================================
-- ============================================================
-- Seed data for CoalMine
-- Run after 0001_init.sql
-- ============================================================

insert into mines (name, location, type, status, risk_score, risk_status, compliance_score, workers_on_site, last_inspection, zones)
values
  ('Mine A', 'Jharkhand',      'underground', 'active',      82, 'critical', 67, 342, '2026-08-15', array['Pit Area A','Haul Road A','Workshop A','Processing Area A','Storage Yard A']),
  ('Mine B', 'Odisha',         'opencast',    'active',      76, 'high',     72, 287, '2026-08-12', array['Pit Area B','Haul Road B','Workshop B','Processing Area B','Storage Yard B']),
  ('Mine C', 'Madhya Pradesh', 'underground', 'maintenance', 62, 'medium',   78, 156, '2026-08-18', array['Pit Area C','Haul Road C','Workshop C','Processing Area C','Storage Yard C']),
  ('Mine D', 'Chhattisgarh',   'opencast',    'active',      28, 'safe',     91, 412, '2026-08-20', array['Pit Area D','Haul Road D','Workshop D','Processing Area D','Storage Yard D']),
  ('Mine E', 'West Bengal',    'underground', 'active',      34, 'safe',     88, 289, '2026-08-22', array['Pit Area E','Haul Road E','Workshop E','Processing Area E','Storage Yard E']),
  ('Mine F', 'Telangana',      'opencast',    'active',      45, 'medium',   82, 178, '2026-08-10', array['Pit Area F','Haul Road F','Workshop F','Processing Area F','Storage Yard F']);

-- Compliance
insert into compliance_items (title, mine_id, status, priority, category, assigned_to, description, due_date)
select v.title, m.id, v.status::compliance_status, v.priority::compliance_priority, v.category::compliance_category, v.assigned_to, v.description, v.due_date::date
from (values
  ('Environmental Report Submission', 'Mine A', 'overdue', 'high',   'Environment', 'Dr. Sharma', 'Submit environmental compliance reports.', '2026-08-20'),
  ('Safety Drill Documentation',      'Mine B', 'urgent',  'high',   'Safety',      'Mr. Verma',  'Documentation on quarterly fire safety drills.', '2026-08-26'),
  ('Contractor License Renewal',      'Mine C', 'pending', 'medium', 'Statutory',   'Ms. Patel',  'Verify sub-contractor details and renew license.', '2026-09-01'),
  ('Fire Safety Audit',               'Mine D', 'pending', 'medium', 'Safety',      'Mr. Singh',  'Audit of extinguishers and fire safety checklists.', '2026-09-04'),
  ('PPE Compliance Check',            'Mine E', 'completed','low',   'Safety',      'Dr. Sharma', 'Physical checks of helmets and protective masks.', '2026-08-22')
) as v(title, mine_name, status, priority, category, assigned_to, description, due_date)
join mines m on m.name = v.mine_name;

-- Incidents
insert into incidents (title, type, mine_id, zone_name, incident_date, incident_time, severity, description, reported_by, status)
select v.title, v.type, m.id, v.zone, v.idate::date, v.itime::time, v.severity::incident_severity, v.description, v.reported_by, v.status::incident_status
from (values
  ('Fire at Equipment Shed', 'fire',       'Mine A', 'Workshop A',    '2026-08-23', '08:15', 'high',   'Fire reported in the auxiliary tools shed.', 'Dr. Sharma', 'investigating'),
  ('Water Inflow in Shaft',  'water',      'Mine B', 'Pit Area B',    '2026-08-20', '11:30', 'medium', 'Water accumulation detected at secondary level.', 'Mr. Verma', 'resolved'),
  ('Equipment Failure',      'mechanical', 'Mine C', 'Workshop C',    '2026-08-18', '16:00', 'low',    'Conveyor system belt slip incident.', 'Ms. Patel', 'resolved'),
  ('Gas Leak Detection',     'gas',        'Mine D', 'Pit Area D',    '2026-08-25', '10:45', 'high',   'CO detector triggered alarm levels.', 'Mr. Singh', 'investigating'),
  ('Worker Injury',          'injury',     'Mine E', 'Storage Yard E','2026-08-26', '15:20', 'medium', 'Worker minor slip during stock arrangement.', 'Dr. Sharma', 'reported')
) as v(title, type, mine_name, zone, idate, itime, severity, description, reported_by, status)
join mines m on m.name = v.mine_name;

-- Inspections
insert into inspections (title, mine_id, zone_name, inspection_type, inspector_name, inspection_date, inspection_time, observation, severity, status)
select v.title, m.id, v.zone, v.itype::inspection_type, v.inspector, v.idate::date, v.itime::time, v.observation, v.severity::incident_severity, v.status::inspection_status
from (values
  ('Quarterly Safety Inspection',    'Mine A', 'Pit Area A',    'Safety',               'Dr. Sharma', '2026-08-28', '09:00', 'Routine quarterly check.', 'low', 'scheduled'),
  ('Environmental Compliance Check', 'Mine B', 'Processing Area B', 'Environment',      'Mr. Verma',  '2026-08-25', '10:00', 'Checking effluent discharge levels.', 'medium', 'in-progress'),
  ('Equipment Safety Audit',         'Mine C', 'Workshop C',    'Statutory Compliance', 'Ms. Patel',  '2026-08-22', '14:00', 'Audit completed, no major issues.', 'low', 'completed'),
  ('Worker Safety Inspection',       'Mine D', 'Haul Road D',   'Labour',               'Mr. Singh',  '2026-08-30', '11:00', 'PPE and safety gear check.', 'low', 'scheduled'),
  ('Emergency Preparedness Review',  'Mine E', 'Storage Yard E','General',              'Dr. Sharma', '2026-09-01', '09:30', 'Review of emergency response plans.', 'medium', 'pending')
) as v(title, mine_name, zone, itype, inspector, idate, itime, observation, severity, status)
join mines m on m.name = v.mine_name;

-- ------------------------------------------------------------
-- Note: demo user accounts (previously in src/data/users.ts) must be
-- created via Supabase Auth, not SQL — the profiles table is populated
-- automatically by the handle_new_user() trigger on signup. See
-- supabase/create-demo-users.md for the exact steps.
-- ------------------------------------------------------------


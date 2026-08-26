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

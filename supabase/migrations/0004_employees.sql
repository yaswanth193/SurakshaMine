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

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

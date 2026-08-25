# CoalMine — Backend Setup (Supabase)

Real Postgres database, real auth, real-time updates via Supabase Realtime,
and role/mine-scoped access enforced at the database layer with Row-Level
Security — replacing the previous localStorage mock data.

## 1. Create a Supabase project

https://supabase.com/dashboard → New Project (free tier is fine).

## 2. Run the migrations

In the Supabase SQL Editor, run in order:
1. `supabase/migrations/0001_init.sql` — tables, enums, triggers, RLS policies, realtime
2. `supabase/migrations/0002_storage.sql` — evidence file storage bucket + policies
3. `supabase/seed.sql` — demo mines, compliance tasks, incidents, inspections

(Or via CLI: `supabase link --project-ref <ref>` then `supabase db push`.)

## 3. Create demo user accounts

`auth.users` can't be seeded via plain SQL — see `supabase/create-demo-users.md`
for the dashboard steps or an admin-API script to create the 5 demo accounts
(admin, corporate, manager, inspector, authority — all password `password`).

## 4. Environment variables

Copy `.env.example` to `.env.local` and fill in your project's URL and keys
(Settings → API in the Supabase dashboard).

## 5. Install and run

```bash
npm install
npm run dev
```

## What changed from the mock version

| Before | Now |
|---|---|
| `src/data/users.ts` hardcoded array | Real Supabase Auth users + `profiles` table |
| `localStorage.getItem("coalgov360_session")` | `useSession()` hook reading the real authenticated user + DB role |
| `permissions.ts` role check only in the browser | Same logic, but also enforced server-side in `middleware.ts` **and** at the database level via RLS — a user can't bypass it by editing localStorage |
| `complianceService` / `incidentService` / `inspectionService` reading/writing `localStorage` | `/api/compliance`, `/api/incidents`, `/api/inspections` route handlers backed by Postgres |
| Mine Manager's mine-scoping done by filtering arrays in the frontend | Enforced by Postgres RLS policies — the database itself refuses to return another mine's rows |
| `evidenceName` — just a filename string, no real file | `POST /api/evidence` uploads to Supabase Storage, returns a signed URL; store the returned `path` in `evidence_url` |
| Activity feed — hardcoded array | Auto-populated by Postgres triggers whenever an incident/compliance/inspection row is inserted or its status changes |
| No live updates | `useRealtimeSync` subscribes to Postgres change events — any insert/update/delete pushes to every connected client within the RLS policy's visibility, no polling |

## Still to wire up in the pages

The backend (schema, RLS, auth, storage, API routes, realtime-enabled React
Query hooks) is complete and ready to use. The four data pages —
`dashboard`, `compliance`, `incidents`, `inspections` — and the `gis` page
still read from the old mock arrays / `complianceService.getComplianceItems()`
etc. Swapping them over means:

1. Replace `useState` + `useEffect(() => service.getX())` with the matching
   hook from `src/hooks/` (e.g. `useCompliance()`, `useIncidents()`).
2. Replace `session` state read from `localStorage` with `useSession()`.
3. Field names move from camelCase (`item.mineId`, `item.dueDate`) to
   snake_case to match Postgres columns (`item.mine_id`, `item.due_date`) —
   the shapes are documented in `src/types/database.ts`.
4. For the incident/inspection report forms, capture GPS via
   `navigator.geolocation.getCurrentPosition()` (your `gis/page.tsx` already
   does this), upload any evidence file to `POST /api/evidence` first, then
   pass the returned `path` as `evidenceUrl` when creating the incident/inspection.

I did this exact page-by-page swap for the sibling `coalgov360` repo earlier
in this conversation — happy to do the same here for `dashboard`, `compliance`,
`incidents`, `inspections`, and `gis` if you want me to continue.

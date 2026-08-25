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

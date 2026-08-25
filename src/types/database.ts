// Matches supabase/migrations/0001_init.sql

export type UserRole = "ADMIN" | "CORPORATE_MANAGEMENT" | "MINE_MANAGER" | "INSPECTOR" | "REGULATORY_AUTHORITY";

export type MineType = "underground" | "opencast";
export type MineStatus = "active" | "inactive" | "maintenance";
export type RiskStatus = "critical" | "high" | "medium" | "low" | "safe";

export type ComplianceStatus = "overdue" | "urgent" | "pending" | "completed" | "in-progress";
export type CompliancePriority = "high" | "medium" | "low" | "critical";
export type ComplianceCategory = "Safety" | "Environment" | "Labour" | "Production" | "Statutory";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type IncidentStatus = "reported" | "investigating" | "action-required" | "resolved" | "closed";

export type InspectionType = "Safety" | "Environment" | "Labour" | "Production" | "Statutory Compliance" | "General";
export type InspectionStatus = "scheduled" | "in-progress" | "completed" | "pending" | "requires-action" | "closed";

export type LocationSource = "GPS" | "Fallback";
export type ActivityType = "inspection" | "violation" | "compliance" | "alert" | "incident" | "system";

export interface Mine {
  id: string;
  name: string;
  location: string;
  type: MineType;
  status: MineStatus;
  risk_score: number;
  risk_status: RiskStatus;
  compliance_score: number;
  workers_on_site: number;
  last_inspection: string | null;
  zones: string[];
  created_at: string;
  updated_at: string;
}

export interface ComplianceItem {
  id: string;
  title: string;
  mine_id: string;
  status: ComplianceStatus;
  priority: CompliancePriority;
  category: ComplianceCategory;
  assigned_to: string;
  description: string;
  due_date: string;
  document_name: string | null;
  document_url: string | null;
  created_at: string;
  updated_at: string;
  mine_name?: string;
}

export interface Incident {
  id: string;
  title: string;
  type: string;
  mine_id: string;
  zone_name: string | null;
  incident_date: string;
  incident_time: string;
  severity: IncidentSeverity;
  description: string;
  reported_by: string;
  immediate_action: string | null;
  root_cause: string | null;
  evidence_url: string | null;
  latitude: number | null;
  longitude: number | null;
  location_source: LocationSource | null;
  status: IncidentStatus;
  created_at: string;
  updated_at: string;
  mine_name?: string;
  mine_location?: string;
}

export interface Inspection {
  id: string;
  title: string;
  mine_id: string;
  zone_name: string | null;
  inspection_type: InspectionType;
  inspector_name: string;
  inspection_date: string;
  inspection_time: string;
  observation: string;
  severity: IncidentSeverity;
  evidence_url: string | null;
  latitude: number | null;
  longitude: number | null;
  location_source: LocationSource | null;
  remarks: string | null;
  status: InspectionStatus;
  created_at: string;
  updated_at: string;
  mine_name?: string;
  mine_location?: string;
}

export interface ActivityRow {
  id: string;
  type: ActivityType;
  message: string;
  mine_id: string | null;
  user_name: string;
  priority: CompliancePriority | null;
  read: boolean;
  created_at: string;
  mine_name?: string;
}

export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  mine_id: string | null;
  created_at: string;
}

export interface DashboardStats {
  totalMines: number;
  complianceScore: number;
  openViolations: number;
  pendingInspections: number;
  activeWorkers: number;
  activeIncidentsCount: number;
}

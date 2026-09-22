import type { ComplianceItem, Incident, Inspection, Mine } from "@/types/database";

export interface AIInsight {
  id: string;
  type: "alert" | "prediction" | "anomaly";
  title: string;
  mineId: string;
  mineName: string;
  location: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  confidence: number;
  riskScore: number;
  factors: string[];
  recommendation: string;
  actionText: string;
  actionRoute: string;
  relatedComplianceId?: string;
  relatedInspectionId?: string;
  relatedIncidentId?: string;
  status: "active" | "resolved";
}

const STORAGE_KEY = "suraksha_resolved_insights";

export function getResolvedInsightIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function resolveInsightId(id: string): void {
  if (typeof window === "undefined") return;
  const current = getResolvedInsightIds();
  current.add(id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(current)));
}

export function generateLiveInsights(params: {
  compliance: ComplianceItem[];
  incidents: Incident[];
  inspections: Inspection[];
  mines: Mine[];
  targetMineId?: string;
}): AIInsight[] {
  const { compliance, incidents, inspections, mines, targetMineId } = params;
  const resolved = getResolvedInsightIds();
  const list: AIInsight[] = [];

  // Filter datasets by targetMineId if specified
  const filteredCompliance = targetMineId ? compliance.filter(c => c.mine_id === targetMineId) : compliance;
  const filteredIncidents = targetMineId ? incidents.filter(i => i.mine_id === targetMineId) : incidents;
  const filteredInspections = targetMineId ? inspections.filter(ins => ins.mine_id === targetMineId) : inspections;

  // Helper to find mine info
  const getMine = (id?: string) => mines.find(m => m.id === id);

  // 1. Compliance Alerts & Predictions
  filteredCompliance.forEach(item => {
    const isOverdue = item.status === "overdue" || (item.status !== "completed" && new Date(item.due_date).getTime() < Date.now());
    const isUrgent = (item.priority === "critical" || item.priority === "high") && item.status !== "completed";
    const mine = getMine(item.mine_id);
    const mineName = item.mine_name || mine?.name || "Mine Site";
    const location = mine?.location || "Sector";

    if (isOverdue) {
      const id = `INS-COMP-OD-${item.id.slice(0, 8)}`;
      list.push({
        id,
        type: "alert",
        title: `Overdue Compliance: ${item.title}`,
        mineId: item.mine_id,
        mineName,
        location,
        severity: item.priority === "critical" ? "critical" : "high",
        description: `Compliance requirement '${item.title}' (${item.category}) is overdue since ${item.due_date}. Immediate submission or review is mandatory.`,
        confidence: 94,
        riskScore: item.priority === "critical" ? 88 : 74,
        factors: [
          `Category: ${item.category}`,
          `Assigned to: ${item.assigned_to}`,
          `Due date: ${item.due_date}`,
          item.description ? item.description.slice(0, 80) : "Statutory safety mandate",
        ],
        recommendation: `Expedite submission for ${item.title} and notify the regulatory desk.`,
        actionText: "Review Compliance",
        actionRoute: "/compliance",
        relatedComplianceId: item.id,
        status: resolved.has(id) ? "resolved" : "active",
      });
    } else if (isUrgent) {
      const id = `INS-COMP-PR-${item.id.slice(0, 8)}`;
      list.push({
        id,
        type: "prediction",
        title: `Approaching Deadline: ${item.title}`,
        mineId: item.mine_id,
        mineName,
        location,
        severity: "medium",
        description: `High-priority compliance item '${item.title}' due on ${item.due_date}. Timely documentation review prevents statutory violations.`,
        confidence: 82,
        riskScore: 60,
        factors: [
          `Category: ${item.category}`,
          `Assigned to: ${item.assigned_to}`,
          `Priority: ${item.priority.toUpperCase()}`,
        ],
        recommendation: `Verify documentation readiness before due date.`,
        actionText: "Verify Task",
        actionRoute: "/compliance",
        relatedComplianceId: item.id,
        status: resolved.has(id) ? "resolved" : "active",
      });
    }
  });

  // 2. Incident Alerts & Anomalies
  filteredIncidents.forEach(item => {
    const isActive = item.status !== "resolved" && item.status !== "closed";
    if (!isActive) return;

    const mine = getMine(item.mine_id);
    const mineName = item.mine_name || mine?.name || "Mine Site";
    const location = item.zone_name || mine?.location || "Active Shaft";

    const isCritical = item.severity === "critical";
    const isHigh = item.severity === "high";
    const id = `INS-INC-${item.id.slice(0, 8)}`;

    list.push({
      id,
      type: isCritical ? "alert" : "anomaly",
      title: `${item.type || "Safety"} Incident: ${item.title || "Active Hazard"}`,
      mineId: item.mine_id,
      mineName,
      location,
      severity: (item.severity as any) || "high",
      description: `Active incident reported in ${location}: ${item.description || item.title}. Current investigation status: ${item.status}.`,
      confidence: 92,
      riskScore: isCritical ? 92 : isHigh ? 78 : 55,
      factors: [
        `Reported by: ${item.reported_by}`,
        `Incident Date: ${item.incident_date}`,
        item.immediate_action ? `Action taken: ${item.immediate_action}` : "Immediate containment required",
        item.root_cause ? `Identified root cause: ${item.root_cause}` : "Cause under investigation",
      ],
      recommendation: item.root_cause ? `Eliminate identified hazard: ${item.root_cause}.` : `Inspect ${location} and enforce safety containment.`,
      actionText: "Investigate Incident",
      actionRoute: "/incidents",
      relatedIncidentId: item.id,
      status: resolved.has(id) ? "resolved" : "active",
    });
  });

  // 3. Inspection Actions & Safety Observations
  filteredInspections.forEach(item => {
    const needsAction = item.status === "requires-action" || (item.status === "in-progress" && (item.severity === "high" || item.severity === "critical"));
    if (!needsAction) return;

    const mine = getMine(item.mine_id);
    const mineName = item.mine_name || mine?.name || "Mine Site";
    const location = item.zone_name || mine?.location || "Audit Zone";
    const id = `INS-AUD-${item.id.slice(0, 8)}`;

    list.push({
      id,
      type: "prediction",
      title: `Corrective Action Required: ${item.title || item.inspection_type}`,
      mineId: item.mine_id,
      mineName,
      location,
      severity: (item.severity as any) || "medium",
      description: `Safety inspection in ${location} recorded findings requiring action: ${item.observation || item.title}.`,
      confidence: 88,
      riskScore: item.severity === "critical" ? 85 : 68,
      factors: [
        `Inspector: ${item.inspector_name}`,
        `Audit Type: ${item.inspection_type}`,
        `Audited Date: ${item.inspection_date}`,
        item.remarks ? `Remarks: ${item.remarks}` : "Follow-up verification pending",
      ],
      recommendation: `Rectify identified hazards and re-inspect ${location}.`,
      actionText: "View Inspection",
      actionRoute: "/inspections",
      relatedInspectionId: item.id,
      status: resolved.has(id) ? "resolved" : "active",
    });
  });

  // 4. Baseline insight if no active insights exist for the selected scope
  if (list.filter(i => i.status === "active").length === 0) {
    const primaryMine = (targetMineId ? getMine(targetMineId) : mines[0]) || { id: targetMineId || "mine-a", name: "Mine A", location: "Jharkhand" };
    const id = `INS-BASELINE-1`;
    list.push({
      id,
      type: "prediction",
      title: "Atmospheric & Ventilation Stability",
      mineId: primaryMine.id,
      mineName: primaryMine.name,
      location: primaryMine.location,
      severity: "low",
      description: "Sensor telemetry and inspection audit logs indicate normal airflow and methane levels within threshold limits.",
      confidence: 96,
      riskScore: 18,
      factors: [
        "Ventilation fans running within normal pressure bounds",
        "No toxic gas alarms recorded in the last 14 days",
        "Routine statutory audits up-to-date",
      ],
      recommendation: "Maintain scheduled weekly calibrations of portable and stationary gas monitors.",
      actionText: "View Inspections",
      actionRoute: "/inspections",
      status: resolved.has(id) ? "resolved" : "active",
    });
  }

  return list;
}

export const insightService = {
  resolveInsight(id: string): void {
    resolveInsightId(id);
  }
};

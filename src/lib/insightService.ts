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

const defaultInsights: AIInsight[] = [
  {
    id: "IN-001",
    type: "alert",
    title: "Recurring Safety Observation",
    mineId: "M1",
    mineName: "Mine A",
    location: "Jharkhand",
    severity: "critical",
    description: "Repeated safety observations (lack of gas check validation logs) detected in recent inspections.",
    confidence: 92,
    riskScore: 82,
    factors: [
      "3 overdue compliance tasks",
      "2 recurring inspection findings",
      "1 unresolved high-severity incident",
      "Pending gas validation logs corrective action"
    ],
    recommendation: "Schedule safety verification inspection within 24 hours.",
    actionText: "Create Action",
    actionRoute: "/inspections",
    status: "active"
  },
  {
    id: "IN-002",
    type: "alert",
    title: "Environmental Compliance Risk",
    mineId: "M3",
    mineName: "Mine C",
    location: "Madhya Pradesh",
    severity: "high",
    description: "Multiple environmental compliance tasks are approaching or past their due dates.",
    confidence: 85,
    riskScore: 62,
    factors: [
      "2 environmental tasks overdue",
      "Previous delay on quarterly submit",
      "Pending environmental clearance audit corrective action"
    ],
    recommendation: "Review overdue environmental compliance records.",
    actionText: "Review Compliance",
    actionRoute: "/compliance",
    status: "active"
  },
  {
    id: "IN-003",
    type: "prediction",
    title: "Statutory Clearance Delay Prediction",
    mineId: "M2",
    mineName: "Mine B",
    location: "Odisha",
    severity: "high",
    description: "Predicted statutory compliance delay within the next reporting cycle.",
    confidence: 78,
    riskScore: 76,
    factors: [
      "2 overdue compliance tasks",
      "Previous recurring delay on water logs",
      "Related inspection finding unresolved for 12 days"
    ],
    recommendation: "Schedule water discharge logs compliance review.",
    actionText: "Schedule Review",
    actionRoute: "/compliance",
    status: "active"
  },
  {
    id: "IN-004",
    type: "prediction",
    title: "Labour Standards Compliance Delay",
    mineId: "M5",
    mineName: "Mine E",
    location: "West Bengal",
    severity: "medium",
    description: "Potential delay in submitting the monthly contract labour verification.",
    confidence: 71,
    riskScore: 34,
    factors: [
      "1 contractor license renewal pending",
      "Staff shortage reported in admin department"
    ],
    recommendation: "Verify contractor license renewal tasks.",
    actionText: "Verify Tasks",
    actionRoute: "/compliance",
    status: "active"
  },
  {
    id: "IN-005",
    type: "anomaly",
    title: "Operational Anomaly: Inspection Spike",
    mineId: "M4",
    mineName: "Mine D",
    location: "Chhattisgarh",
    severity: "medium",
    description: "Inspection activity increased by 42% compared with the previous reporting period.",
    confidence: 88,
    riskScore: 28,
    factors: [
      "Multiple repeated observations recorded in same area",
      "Spike in reported near-miss logs"
    ],
    recommendation: "Review recent safety inspections and observations.",
    actionText: "Review Findings",
    actionRoute: "/inspections",
    status: "active"
  },
  {
    id: "IN-006",
    type: "alert",
    title: "Equipment Maintenance Delay Alert",
    mineId: "M6",
    mineName: "Mine F",
    location: "Telangana",
    severity: "high",
    description: "Unresolved high-severity incident logs indicating conveyor belt wear.",
    confidence: 86,
    riskScore: 45,
    factors: [
      "1 unresolved active conveyor incident",
      "Overdue maintenance check list tasks"
    ],
    recommendation: "Verify corrective maintenance action completion.",
    actionText: "View Action",
    actionRoute: "/incidents",
    status: "active"
  }
];

const STORAGE_KEY = "coalgov360_insights";

export const insightService = {
  getInsights(): AIInsight[] {
    if (typeof window === "undefined") return defaultInsights;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultInsights));
      return defaultInsights;
    }
    try {
      return JSON.parse(saved) as AIInsight[];
    } catch (e) {
      return defaultInsights;
    }
  },
  
  resolveInsight(id: string): void {
    const list = this.getInsights();
    const updated = list.map(item => item.id === id ? { ...item, status: "resolved" as const } : item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
};

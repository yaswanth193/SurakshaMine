export interface Mine {
  id: string;
  name: string;
  location: string;
  riskScore: number;
  riskStatus: "critical" | "high" | "medium" | "low" | "safe";
  complianceScore: number;
  lastInspection: string;
  pendingViolations: number;
  workersOnSite: number;
  type: "underground" | "opencast";
  status: "active" | "inactive" | "maintenance";
}

export interface ComplianceItem {
  id: string;
  title: string;
  mineId: string;
  mineName: string;
  status: "overdue" | "urgent" | "pending" | "completed" | "in-progress";
  dueDate: string; // YYYY-MM-DD
  priority: "high" | "medium" | "low" | "critical";
  category: "Safety" | "Environment" | "Labour" | "Production" | "Statutory";
  assignedTo: string;
  description: string;
  createdAt?: string;
  documentName?: string;
  mine?: string; // backwards compatibility mapping
}

export const mockMines: Mine[] = [
  { id: "M1", name: "Mine A", location: "Jharkhand", riskScore: 82, riskStatus: "critical", complianceScore: 67, lastInspection: "2026-08-15", pendingViolations: 5, workersOnSite: 342, type: "underground", status: "active" },
  { id: "M2", name: "Mine B", location: "Odisha", riskScore: 76, riskStatus: "high", complianceScore: 72, lastInspection: "2026-08-12", pendingViolations: 3, workersOnSite: 287, type: "opencast", status: "active" },
  { id: "M3", name: "Mine C", location: "Madhya Pradesh", riskScore: 62, riskStatus: "medium", complianceScore: 78, lastInspection: "2026-08-18", pendingViolations: 2, workersOnSite: 156, type: "underground", status: "maintenance" },
  { id: "M4", name: "Mine D", location: "Chhattisgarh", riskScore: 28, riskStatus: "safe", complianceScore: 91, lastInspection: "2026-08-20", pendingViolations: 0, workersOnSite: 412, type: "opencast", status: "active" },
  { id: "M5", name: "Mine E", location: "West Bengal", riskScore: 34, riskStatus: "safe", complianceScore: 88, lastInspection: "2026-08-22", pendingViolations: 1, workersOnSite: 289, type: "underground", status: "active" },
  { id: "M6", name: "Mine F", location: "Telangana", riskScore: 45, riskStatus: "medium", complianceScore: 82, lastInspection: "2026-08-10", pendingViolations: 2, workersOnSite: 178, type: "opencast", status: "active" },
];

export const mockUsers: string[] = [
  "Dr. Sharma",
  "Mr. Verma",
  "Ms. Patel",
  "Mr. Singh",
  "Admin Kumar"
];

export const initialCompliance: ComplianceItem[] = [
  { id: "C1", title: "Environmental Report Submission", mineId: "M1", mineName: "Mine A", status: "overdue", dueDate: "2026-08-20", priority: "high", category: "Environment", assignedTo: "Dr. Sharma", description: "Submit environmental compliance reports." },
  { id: "C2", title: "Safety Drill Documentation", mineId: "M2", mineName: "Mine B", status: "urgent", dueDate: "2026-08-26", priority: "high", category: "Safety", assignedTo: "Mr. Verma", description: "Documentation on the quarterly fire safety drills." },
  { id: "C3", title: "Contractor License Renewal", mineId: "M3", mineName: "Mine C", status: "pending", dueDate: "2026-09-01", priority: "medium", category: "Statutory", assignedTo: "Ms. Patel", description: "Verify sub-contractor details and renew license documents." },
  { id: "C4", title: "Fire Safety Audit", mineId: "M4", mineName: "Mine D", status: "pending", dueDate: "2026-09-04", priority: "medium", category: "Safety", assignedTo: "Mr. Singh", description: "Audit of extinguishers and fire safety check lists." },
  { id: "C5", title: "PPE Compliance Check", mineId: "M5", mineName: "Mine E", status: "completed", dueDate: "2026-08-22", priority: "low", category: "Safety", assignedTo: "Dr. Sharma", description: "Physical checks of helmets and protective masks." }
];

const LOCAL_STORAGE_KEY = "coalgov360_compliance";

export function getUpdatedStatus(item: { dueDate: string; status: string }): string {
  if (item.status === "completed") {
    return "completed";
  }

  try {
    let dueTime = new Date(item.dueDate).getTime();
    if (isNaN(dueTime)) {
      // Check for formats like "20 Aug" and append 2026
      const currentYear = new Date().getFullYear();
      const parsed = new Date(`${item.dueDate} ${currentYear}`);
      dueTime = parsed.getTime();
    }

    if (!isNaN(dueTime)) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDateObj = new Date(dueTime);
      dueDateObj.setHours(0, 0, 0, 0);

      if (dueDateObj < today) {
        return "overdue";
      }
    }
  } catch (e) {
    console.error("Error computing status for item", e);
  }

  return item.status;
}

export const complianceService = {
  getMines(): Mine[] {
    return mockMines;
  },

  getUsers(): string[] {
    return mockUsers;
  },

  getComplianceItems(): ComplianceItem[] {
    if (typeof window === "undefined") {
      return initialCompliance.map(item => ({
        ...item,
        status: getUpdatedStatus(item) as any,
        mine: item.mineName
      }));
    }

    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialCompliance));
      return initialCompliance.map(item => ({
        ...item,
        status: getUpdatedStatus(item) as any,
        mine: item.mineName
      }));
    }

    try {
      const items = JSON.parse(stored) as ComplianceItem[];
      return items.map(item => ({
        ...item,
        status: getUpdatedStatus(item) as any,
        mine: item.mineName
      }));
    } catch (e) {
      console.error("Error parsing stored compliance items", e);
      return initialCompliance.map(item => ({
        ...item,
        status: getUpdatedStatus(item) as any,
        mine: item.mineName
      }));
    }
  },

  createComplianceItem(newItem: Omit<ComplianceItem, "id" | "createdAt">): ComplianceItem {
    const items = this.getComplianceItems();
    const id = "C_" + Date.now();
    const created: ComplianceItem = {
      ...newItem,
      id,
      createdAt: new Date().toISOString(),
      status: getUpdatedStatus(newItem) as any,
      mine: newItem.mineName
    };

    items.push(created);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    }
    return created;
  },

  calculateComplianceStats(items: ComplianceItem[]) {
    let overdue = 0;
    let pending = 0;
    let completed = 0;

    items.forEach(item => {
      const status = getUpdatedStatus(item);
      if (status === "completed") {
        completed++;
      } else if (status === "overdue") {
        overdue++;
      } else {
        pending++; // 'pending', 'urgent', or 'in-progress'
      }
    });

    return {
      total: items.length,
      overdue,
      pending,
      completed
    };
  }
};

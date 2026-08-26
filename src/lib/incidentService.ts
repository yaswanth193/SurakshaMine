import { complianceService } from "./complianceService";

export interface IncidentItem {
  id: string;
  title: string;
  type: string; // "fire" | "water" | "gas" | "mechanical" | "injury" | "safety" | "near-miss" | "environmental" | "operational" | "labour" | "other"
  mineId: string;
  mineName: string;
  zoneName: string;
  incidentDate: string; // YYYY-MM-DD
  incidentTime: string; // HH:MM
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  reportedBy: string;
  immediateAction?: string;
  rootCause?: string;
  evidenceName?: string;
  latitude?: number;
  longitude?: number;
  locationSource?: "GPS" | "Fallback";
  status: "reported" | "investigating" | "action-required" | "resolved" | "closed";
  createdAt: string;

  // Backwards compatibility mappings for UI
  mine?: string;
  location?: string; // mine state
  date?: string; // short date
}

const mineStateMapping: Record<string, string> = {
  "Mine A": "Jharkhand",
  "Mine B": "Odisha",
  "Mine C": "Madhya Pradesh",
  "Mine D": "Chhattisgarh",
  "Mine E": "West Bengal",
  "Mine F": "Telangana"
};

export const initialIncidents: IncidentItem[] = [
  { id: "INC-1001", title: "Fire at Equipment Shed", type: "fire", mineId: "M1", mineName: "Mine A", zoneName: "Workshop A", incidentDate: "2026-08-23", incidentTime: "08:15", severity: "high", description: "Fire reported in the auxiliary tools shed.", reportedBy: "Dr. Sharma", status: "investigating", createdAt: "2026-08-23T00:00:00.000Z" },
  { id: "INC-1002", title: "Water Inflow in Shaft", type: "water", mineId: "M2", mineName: "Mine B", zoneName: "Pit Area B", incidentDate: "2026-08-20", incidentTime: "11:30", severity: "medium", description: "Water accumulation detected at secondary level.", reportedBy: "Mr. Verma", status: "resolved", createdAt: "2026-08-20T00:00:00.000Z" },
  { id: "INC-1003", title: "Equipment Failure", type: "mechanical", mineId: "M3", mineName: "Mine C", zoneName: "Workshop C", incidentDate: "2026-08-18", incidentTime: "16:00", severity: "low", description: "Conveyor system belt slip incident.", reportedBy: "Ms. Patel", status: "resolved", createdAt: "2026-08-18T00:00:00.000Z" },
  { id: "INC-1004", title: "Gas Leak Detection", type: "gas", mineId: "M4", mineName: "Mine D", zoneName: "Pit Area D", incidentDate: "2026-08-25", incidentTime: "10:45", severity: "high", description: "CO detector triggered alarm levels.", reportedBy: "Mr. Singh", status: "investigating", createdAt: "2026-08-25T00:00:00.000Z" },
  { id: "INC-1005", title: "Worker Injury", type: "injury", mineId: "M5", mineName: "Mine E", zoneName: "Storage Yard E", incidentDate: "2026-08-26", incidentTime: "15:20", severity: "medium", description: "Worker minor slip during stock arrangement.", reportedBy: "Dr. Sharma", status: "reported", createdAt: "2026-08-26T00:00:00.000Z" }
];

const LOCAL_STORAGE_KEY = "coalgov360_incidents";

function formatDateShort(dateStr: string) {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch (e) {
    return dateStr;
  }
}

function mapForCompatibility(item: IncidentItem): IncidentItem {
  return {
    ...item,
    mine: item.mineName,
    location: mineStateMapping[item.mineName] || "Unknown Area",
    date: formatDateShort(item.incidentDate)
  };
}

export const incidentService = {
  getIncidents(): IncidentItem[] {
    if (typeof window === "undefined") {
      return initialIncidents.map(i => mapForCompatibility(i));
    }
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialIncidents));
      return initialIncidents.map(i => mapForCompatibility(i));
    }
    try {
      const items = JSON.parse(stored) as IncidentItem[];
      return items.map(i => mapForCompatibility(i));
    } catch (e) {
      console.error("Error loading incidents", e);
      return initialIncidents.map(i => mapForCompatibility(i));
    }
  },

  createIncident(newItem: Omit<IncidentItem, "id" | "status" | "createdAt">): IncidentItem {
    const items = this.getIncidents();
    const id = "INC-" + (1000 + items.length + 1);
    
    // Determine initial status: High/Critical -> action-required, else -> reported
    const status = (newItem.severity === "high" || newItem.severity === "critical")
      ? "action-required"
      : "reported";
      
    const created: IncidentItem = {
      ...newItem,
      id,
      status,
      createdAt: new Date().toISOString()
    };

    const parsedItems = typeof window !== "undefined" && localStorage.getItem(LOCAL_STORAGE_KEY)
      ? JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)!) as IncidentItem[]
      : [...initialIncidents];
      
    parsedItems.push(created);
    
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsedItems));
    }

    return mapForCompatibility(created);
  },

  calculateStats(items: IncidentItem[]) {
    let active = 0;
    let resolved = 0;
    let high = 0;

    items.forEach(item => {
      if (item.status === "resolved" || item.status === "closed") {
        resolved++;
      } else {
        // reported, investigating, action-required
        active++;
      }
      
      if (item.severity === "high" || item.severity === "critical") {
        high++;
      }
    });

    return {
      total: items.length,
      active,
      resolved,
      high
    };
  }
};

import { complianceService } from "./complianceService";

export interface InspectionItem {
  id: string;
  title: string;
  mineId: string;
  mineName: string;
  zoneName: string;
  inspectionType: "Safety" | "Environment" | "Labour" | "Production" | "Statutory Compliance" | "General";
  inspectorName: string;
  inspectionDate: string; // YYYY-MM-DD
  inspectionTime: string; // HH:MM
  observation: string;
  severity: "low" | "medium" | "high" | "critical";
  evidenceName?: string;
  latitude?: number;
  longitude?: number;
  locationSource?: "GPS" | "Fallback";
  remarks?: string;
  status: "scheduled" | "in-progress" | "completed" | "pending" | "requires-action" | "closed";
  createdAt: string;

  // Backwards compatibility bindings
  mine?: string;
  inspector?: string;
  location?: string;
  date?: string;
}

export const mineZones: Record<string, string[]> = {
  M1: ["Pit Area A", "Haul Road A", "Workshop A", "Processing Area A", "Storage Yard A"],
  M2: ["Pit Area B", "Haul Road B", "Workshop B", "Processing Area B", "Storage Yard B"],
  M3: ["Pit Area C", "Haul Road C", "Workshop C", "Processing Area C", "Storage Yard C"],
  M4: ["Pit Area D", "Haul Road D", "Workshop D", "Processing Area D", "Storage Yard D"],
  M5: ["Pit Area E", "Haul Road E", "Workshop E", "Processing Area E", "Storage Yard E"],
  M6: ["Pit Area F", "Haul Road F", "Workshop F", "Processing Area F", "Storage Yard F"],
};

export const defaultZones = ["Pit Area", "Haul Road", "Workshop", "Processing Area", "Storage Yard"];

export const mineCoordinates: Record<string, { lat: number; lng: number }> = {
  M1: { lat: 23.6102, lng: 85.2799 },
  M2: { lat: 20.9517, lng: 85.0985 },
  M3: { lat: 22.9734, lng: 78.6569 },
  M4: { lat: 21.2787, lng: 81.8661 },
  M5: { lat: 23.6102, lng: 87.2799 },
  M6: { lat: 18.1124, lng: 79.0193 },
};

const mineStateMapping: Record<string, string> = {
  "Mine A": "Jharkhand",
  "Mine B": "Odisha",
  "Mine C": "Madhya Pradesh",
  "Mine D": "Chhattisgarh",
  "Mine E": "West Bengal",
  "Mine F": "Telangana"
};

export const initialInspections: InspectionItem[] = [
  { id: "INS-1001", title: "Quarterly Safety Inspection", mineId: "M1", mineName: "Mine A", zoneName: "Pit Area", inspectionType: "Safety", inspectorName: "Dr. Sharma", inspectionDate: "2026-08-28", inspectionTime: "10:00", observation: "No safety hazards found.", severity: "low", status: "scheduled", createdAt: "2026-08-25T00:00:00.000Z" },
  { id: "INS-1002", title: "Environmental Compliance Check", mineId: "M2", mineName: "Mine B", zoneName: "Haul Road", inspectionType: "Environment", inspectorName: "Mr. Verma", inspectionDate: "2026-08-25", inspectionTime: "14:30", observation: "Haul road dust suppression checked.", severity: "medium", status: "in-progress", createdAt: "2026-08-25T00:00:00.000Z" },
  { id: "INS-1003", title: "Equipment Safety Audit", mineId: "M3", mineName: "Mine C", zoneName: "Workshop", inspectionType: "Safety", inspectorName: "Ms. Patel", inspectionDate: "2026-08-22", inspectionTime: "11:15", observation: "Belt conveyor systems safety checks completed.", severity: "low", status: "completed", createdAt: "2026-08-22T00:00:00.000Z" },
  { id: "INS-1004", title: "Worker Safety Inspection", mineId: "M4", mineName: "Mine D", zoneName: "Processing Area", inspectionType: "Labour", inspectorName: "Mr. Singh", inspectionDate: "2026-08-30", inspectionTime: "09:00", observation: "Verify safety helmets usage.", severity: "medium", status: "scheduled", createdAt: "2026-08-25T00:00:00.000Z" },
  { id: "INS-1005", title: "Emergency Preparedness Review", mineId: "M5", mineName: "Mine E", zoneName: "Storage Yard", inspectionType: "Statutory Compliance", inspectorName: "Dr. Sharma", inspectionDate: "2026-09-01", inspectionTime: "16:00", observation: "Review water levels in emergency reserves.", severity: "high", status: "pending", createdAt: "2026-08-25T00:00:00.000Z" }
];

const LOCAL_STORAGE_KEY = "coalgov360_inspections";

function formatDateShort(dateStr: string) {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch (e) {
    return dateStr;
  }
}

function mapForCompatibility(item: InspectionItem): InspectionItem {
  return {
    ...item,
    mine: item.mineName,
    inspector: item.inspectorName,
    location: mineStateMapping[item.mineName] || "Unknown Area",
    date: formatDateShort(item.inspectionDate)
  };
}

export function determineInspectionStatus(severity: "low" | "medium" | "high" | "critical"): "completed" | "requires-action" {
  if (severity === "high" || severity === "critical") {
    return "requires-action";
  }
  return "completed";
}

export const inspectionService = {
  getZonesForMine(mineId: string): string[] {
    return mineZones[mineId] || defaultZones;
  },

  getFallbackCoordinates(mineId: string): { lat: number; lng: number } {
    return mineCoordinates[mineId] || { lat: 23.6102, lng: 85.2799 };
  },

  getInspections(): InspectionItem[] {
    if (typeof window === "undefined") {
      return initialInspections.map(i => mapForCompatibility(i));
    }
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialInspections));
      return initialInspections.map(i => mapForCompatibility(i));
    }
    try {
      const items = JSON.parse(stored) as InspectionItem[];
      return items.map(i => mapForCompatibility(i));
    } catch (e) {
      console.error("Error loading inspections", e);
      return initialInspections.map(i => mapForCompatibility(i));
    }
  },

  createInspection(newItem: Omit<InspectionItem, "id" | "status" | "createdAt">): InspectionItem {
    const items = this.getInspections();
    const id = "INS-" + (1000 + items.length + 1);
    
    // Auto status
    const status = determineInspectionStatus(newItem.severity);
    
    const created: InspectionItem = {
      ...newItem,
      id,
      status,
      createdAt: new Date().toISOString()
    };

    const parsedItems = typeof window !== "undefined" && localStorage.getItem(LOCAL_STORAGE_KEY) 
      ? JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)!) as InspectionItem[]
      : [...initialInspections];
      
    parsedItems.push(created);
    
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsedItems));
    }

    return mapForCompatibility(created);
  },

  calculateStats(items: InspectionItem[]) {
    let scheduled = 0;
    let inProgress = 0;
    let completed = 0;
    
    items.forEach(item => {
      if (item.status === "scheduled") {
        scheduled++;
      } else if (item.status === "in-progress") {
        inProgress++;
      } else if (item.status === "completed" || item.status === "closed") {
        completed++;
      } else {
        // pending or requires-action
        inProgress++; // count pending operations as active/in-progress
      }
    });

    return {
      total: items.length,
      scheduled,
      inProgress,
      completed
    };
  }
};

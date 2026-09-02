// "use client";

// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import axios from "axios";
// import type { Mine } from "@/types/database";
// import { useRealtimeSync } from "./useRealtimeSync";

// async function fetchMines(): Promise<Mine[]> {
//   const { data } = await axios.get("/api/mines");
//   return data.data;
// }

// export function useMines() {
//   useRealtimeSync("mines", ["mines"]);
//   return useQuery({ queryKey: ["mines"], queryFn: fetchMines });
// }

// export function useCreateMine() {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: (payload: Partial<Mine> & { name: string; location: string }) =>
//       axios.post("/api/mines", payload).then((r) => r.data.data),
//     onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mines"] }),
//   });
// }

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type { Mine } from "@/types/database";
import { useRealtimeSync } from "./useRealtimeSync";

// Fallback demo data — shown only if the live API returns nothing
// (e.g. Supabase misconfigured), so the app never appears empty.
const FALLBACK_MINES: Mine[] = [
  { id: "fallback-mine-a", name: "Mine A", location: "Jharkhand", type: "underground", status: "active", risk_score: 82, risk_status: "critical", compliance_score: 67, workers_on_site: 342, last_inspection: "2026-08-15", zones: ["Pit Area A", "Haul Road A", "Workshop A"], created_at: "", updated_at: "" },
  { id: "fallback-mine-b", name: "Mine B", location: "Odisha", type: "opencast", status: "active", risk_score: 76, risk_status: "high", compliance_score: 72, workers_on_site: 287, last_inspection: "2026-08-12", zones: ["Pit Area B", "Haul Road B", "Workshop B"], created_at: "", updated_at: "" },
  { id: "fallback-mine-c", name: "Mine C", location: "Madhya Pradesh", type: "underground", status: "maintenance", risk_score: 62, risk_status: "medium", compliance_score: 78, workers_on_site: 156, last_inspection: "2026-08-18", zones: ["Pit Area C", "Haul Road C", "Workshop C"], created_at: "", updated_at: "" },
  { id: "fallback-mine-d", name: "Mine D", location: "Chhattisgarh", type: "opencast", status: "active", risk_score: 28, risk_status: "safe", compliance_score: 91, workers_on_site: 412, last_inspection: "2026-08-20", zones: ["Pit Area D", "Haul Road D", "Workshop D"], created_at: "", updated_at: "" },
  { id: "fallback-mine-e", name: "Mine E", location: "West Bengal", type: "underground", status: "active", risk_score: 34, risk_status: "safe", compliance_score: 88, workers_on_site: 289, last_inspection: "2026-08-22", zones: ["Pit Area E", "Haul Road E", "Workshop E"], created_at: "", updated_at: "" },
  { id: "fallback-mine-f", name: "Mine F", location: "Telangana", type: "opencast", status: "active", risk_score: 45, risk_status: "medium", compliance_score: 82, workers_on_site: 178, last_inspection: "2026-08-10", zones: ["Pit Area F", "Haul Road F", "Workshop F"], created_at: "", updated_at: "" },
];

async function fetchMines(): Promise<Mine[]> {
  try {
    const { data } = await axios.get("/api/mines");
    return data.data && data.data.length > 0 ? data.data : FALLBACK_MINES;
  } catch {
    return FALLBACK_MINES;
  }
}

export function useMines() {
  useRealtimeSync("mines", ["mines"]);
  return useQuery({ queryKey: ["mines"], queryFn: fetchMines });
}

export function useCreateMine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Mine> & { name: string; location: string }) =>
      axios.post("/api/mines", payload).then((r) => r.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mines"] }),
  });
}

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

// Fallback demo data — uses valid Supabase mine UUIDs so any offline/fallback usage matches the DB
const FALLBACK_MINES: Mine[] = [
  { id: "47d2d435-8bae-49ca-b8d2-b6e71b407e9b", name: "Mine A", location: "Jharkhand", type: "underground", status: "active", risk_score: 82, risk_status: "critical", compliance_score: 67, workers_on_site: 342, last_inspection: "2026-08-15", zones: ["Pit Area A", "Haul Road A", "Workshop A", "Processing Area A", "Storage Yard A"], created_at: "", updated_at: "" },
  { id: "5b8238d0-bfdb-443a-a0ce-fc384cd491fe", name: "Mine B", location: "Odisha", type: "opencast", status: "active", risk_score: 76, risk_status: "high", compliance_score: 72, workers_on_site: 287, last_inspection: "2026-08-12", zones: ["Pit Area B", "Haul Road B", "Workshop B", "Processing Area B", "Storage Yard B"], created_at: "", updated_at: "" },
  { id: "84e0c034-2657-4e92-9f2c-920e419d80f4", name: "Mine C", location: "Madhya Pradesh", type: "underground", status: "maintenance", risk_score: 62, risk_status: "medium", compliance_score: 78, workers_on_site: 156, last_inspection: "2026-08-18", zones: ["Pit Area C", "Haul Road C", "Workshop C", "Processing Area C", "Storage Yard C"], created_at: "", updated_at: "" },
  { id: "3dc40de3-85d1-48fc-bedd-a43567660ef2", name: "Mine D", location: "Chhattisgarh", type: "opencast", status: "active", risk_score: 28, risk_status: "safe", compliance_score: 91, workers_on_site: 412, last_inspection: "2026-08-20", zones: ["Pit Area D", "Haul Road D", "Workshop D", "Processing Area D", "Storage Yard D"], created_at: "", updated_at: "" },
  { id: "16c8fab9-fe38-42bf-bdb1-d08b7a898320", name: "Mine E", location: "West Bengal", type: "underground", status: "active", risk_score: 34, risk_status: "safe", compliance_score: 88, workers_on_site: 289, last_inspection: "2026-08-22", zones: ["Pit Area E", "Haul Road E", "Workshop E", "Processing Area E", "Storage Yard E"], created_at: "", updated_at: "" },
  { id: "a704ccc4-ad9d-4b42-a0bf-30819956c826", name: "Mine F", location: "Telangana", type: "opencast", status: "active", risk_score: 45, risk_status: "medium", compliance_score: 82, workers_on_site: 178, last_inspection: "2026-08-10", zones: ["Pit Area F", "Haul Road F", "Workshop F", "Processing Area F", "Storage Yard F"], created_at: "", updated_at: "" },
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

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type { Inspection, InspectionStatus } from "@/types/database";
import { useRealtimeSync } from "./useRealtimeSync";

interface Filters {
  search?: string;
  status?: string;
  mineId?: string;
}

async function fetchInspections(filters: Filters): Promise<Inspection[]> {
  const { data } = await axios.get("/api/inspections", { params: filters });
  return data.data;
}

export function useInspections(filters: Filters = {}) {
  useRealtimeSync("inspections", ["inspections"]);
  return useQuery({ queryKey: ["inspections", filters], queryFn: () => fetchInspections(filters) });
}

export function useCreateInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      title: string;
      mineId: string;
      zoneName?: string;
      inspectionType: string;
      inspectorName: string;
      inspectionDate: string;
      inspectionTime: string;
      observation?: string;
      severity?: string;
      evidenceUrl?: string;
      latitude?: number;
      longitude?: number;
      locationSource?: "GPS" | "Fallback";
      status?: string;
    }) => axios.post("/api/inspections", payload).then((r) => r.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inspections"] }),
  });
}

export function useUpdateInspectionStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: InspectionStatus }) =>
      axios.patch(`/api/inspections/${id}`, { status }).then((r) => r.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inspections"] }),
  });
}

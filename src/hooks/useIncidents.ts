"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type { Incident, IncidentStatus } from "@/types/database";
import { useRealtimeSync } from "./useRealtimeSync";

interface Filters {
  search?: string;
  status?: string;
  severity?: string;
  mineId?: string;
}

async function fetchIncidents(filters: Filters): Promise<Incident[]> {
  const { data } = await axios.get("/api/incidents", { params: filters });
  return data.data;
}

export function useIncidents(filters: Filters = {}) {
  useRealtimeSync("incidents", ["incidents"]);
  return useQuery({ queryKey: ["incidents", filters], queryFn: () => fetchIncidents(filters) });
}

export function useCreateIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      title: string;
      type: string;
      mineId: string;
      zoneName?: string;
      incidentDate: string;
      incidentTime: string;
      severity: string;
      description: string;
      reportedBy: string;
      immediateAction?: string;
      rootCause?: string;
      evidenceUrl?: string;
      latitude?: number;
      longitude?: number;
      locationSource?: "GPS" | "Fallback";
    }) => axios.post("/api/incidents", payload).then((r) => r.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["incidents"] }),
  });
}

export function useUpdateIncidentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: IncidentStatus }) =>
      axios.patch(`/api/incidents/${id}`, { status }).then((r) => r.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["incidents"] }),
  });
}

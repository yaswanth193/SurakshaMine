"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type { ActivityRow, DashboardStats } from "@/types/database";
import { useRealtimeSync } from "./useRealtimeSync";

async function fetchActivities(mineId?: string, limit = 20): Promise<ActivityRow[]> {
  const { data } = await axios.get("/api/activities", { params: { mineId, limit } });
  return data.data ?? [];
}

export function useActivities(mineId?: string, limit = 20) {
  useRealtimeSync("activities", ["activities"]);
  return useQuery({
    queryKey: ["activities", mineId, limit],
    queryFn: () => fetchActivities(mineId, limit),
    staleTime: 15 * 1000,
  });
}

export function useMarkActivityRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => axios.patch(`/api/activities/${id}`, { read: true }).then((r) => r.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["activities"] }),
  });
}

async function fetchDashboardStats(mineId?: string): Promise<DashboardStats> {
  const { data } = await axios.get("/api/dashboard/stats", { params: { mineId } });
  return data.data;
}

export function useDashboardStats(mineId?: string) {
  useRealtimeSync("mines", ["dashboard-stats"]);
  useRealtimeSync("compliance_items", ["dashboard-stats"]);
  useRealtimeSync("incidents", ["dashboard-stats"]);
  useRealtimeSync("inspections", ["dashboard-stats"]);

  return useQuery({
    queryKey: ["dashboard-stats", mineId],
    queryFn: () => fetchDashboardStats(mineId),
  });
}

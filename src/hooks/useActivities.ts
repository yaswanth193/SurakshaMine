"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type { ActivityRow, DashboardStats } from "@/types/database";
import { useRealtimeSync } from "./useRealtimeSync";

const defaultStats: DashboardStats = {
  totalMines: 0,
  complianceScore: 0,
  openViolations: 0,
  pendingInspections: 0,
  activeWorkers: 0,
  activeIncidentsCount: 0,
};

async function fetchActivities(mineId?: string, limit = 20): Promise<ActivityRow[]> {
  try {
    const validMineId = mineId && mineId !== "all" && mineId !== "null" ? mineId : undefined;
    const { data } = await axios.get("/api/activities", {
      params: { ...(validMineId ? { mineId: validMineId } : {}), limit },
    });
    return data?.data ?? [];
  } catch {
    return [];
  }
}

export function useActivities(mineId?: string, limit = 20) {
  const validMineId = mineId && mineId !== "all" && mineId !== "null" ? mineId : undefined;
  useRealtimeSync("activities", ["activities"]);
  return useQuery({
    queryKey: ["activities", validMineId ?? null, limit],
    queryFn: () => fetchActivities(validMineId, limit),
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
  try {
    const validMineId = mineId && mineId !== "all" && mineId !== "null" ? mineId : undefined;
    const { data } = await axios.get("/api/dashboard/stats", {
      params: validMineId ? { mineId: validMineId } : {},
    });
    return data?.data ?? defaultStats;
  } catch {
    return defaultStats;
  }
}

export function useDashboardStats(mineId?: string) {
  const validMineId = mineId && mineId !== "all" && mineId !== "null" ? mineId : undefined;
  useRealtimeSync("mines", ["dashboard-stats"]);
  useRealtimeSync("compliance_items", ["dashboard-stats"]);
  useRealtimeSync("incidents", ["dashboard-stats"]);
  useRealtimeSync("inspections", ["dashboard-stats"]);

  return useQuery({
    queryKey: ["dashboard-stats", validMineId ?? null],
    queryFn: () => fetchDashboardStats(validMineId),
  });
}

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type { ComplianceItem, ComplianceStatus } from "@/types/database";
import { useRealtimeSync } from "./useRealtimeSync";

interface Filters {
  search?: string;
  status?: string;
  mineId?: string;
}

async function fetchCompliance(filters: Filters): Promise<ComplianceItem[]> {
  try {
    const { data } = await axios.get("/api/compliance", { params: filters });
    return data?.data ?? [];
  } catch {
    return [];
  }
}

export function useCompliance(filters: Filters = {}) {
  useRealtimeSync("compliance_items", ["compliance"]);
  return useQuery({ queryKey: ["compliance", filters], queryFn: () => fetchCompliance(filters) });
}

export function useCreateCompliance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      title: string;
      mineId: string;
      category: string;
      assignedTo: string;
      description?: string;
      dueDate: string;
      priority?: string;
      status?: string;
      documentName?: string;
    }) => axios.post("/api/compliance", payload).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useUpdateComplianceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ComplianceStatus }) =>
      axios.patch(`/api/compliance/${id}`, { status }).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useUpdateCompliance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; [key: string]: any }) =>
      axios.patch(`/api/compliance/${id}`, payload).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useDeleteCompliance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      axios.delete(`/api/compliance/${id}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}


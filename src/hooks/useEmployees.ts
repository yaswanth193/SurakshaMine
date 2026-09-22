"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type { Employee } from "@/types/database";
import { useRealtimeSync } from "./useRealtimeSync";

interface Filters {
  search?: string;
  mineId?: string;
}

async function fetchEmployees(filters: Filters): Promise<Employee[]> {
  try {
    const { data } = await axios.get("/api/employees", { params: filters });
    return data?.data ?? [];
  } catch {
    return [];
  }
}

export function useEmployees(filters: Filters = {}) {
  useRealtimeSync("employees", ["employees"]);
  return useQuery({
    queryKey: ["employees", filters],
    queryFn: () => fetchEmployees(filters),
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      name: string;
      designation: string;
      phone: string;
      mineId: string;
      emergencyName?: string;
      emergencyPhone?: string;
      shift?: string;
      bloodGroup?: string;
      ppeStatus?: string;
      trainingStatus?: string;
      medicalCheckupDate?: string;
      attendance?: boolean;
    }) => axios.post("/api/employees", payload).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Employee> }) =>
      axios.patch(`/api/employees/${id}`, updates).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => axios.delete(`/api/employees/${id}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

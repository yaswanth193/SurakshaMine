"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type { Mine } from "@/types/database";
import { useRealtimeSync } from "./useRealtimeSync";

async function fetchMines(): Promise<Mine[]> {
  const { data } = await axios.get("/api/mines");
  return data.data;
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

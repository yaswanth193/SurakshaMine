"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";

/**
 * Subscribes to Postgres change events on `table` via Supabase Realtime
 * and invalidates `queryKey` on any change. Because RLS is enabled,
 * each client only *receives* realtime events for rows their role/mine
 * is allowed to see — a Mine Manager's browser never even gets notified
 * about another mine's incident.
 */
export function useRealtimeSync(table: string, queryKey: unknown[]) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`realtime:${table}:${queryKey.join(":")}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, JSON.stringify(queryKey)]);
}

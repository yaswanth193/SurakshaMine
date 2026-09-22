"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { MiningNewsItem } from "@/app/api/news/route";

const STORAGE_KEY = "suraksha_read_news_ids";

async function fetchMiningNews(): Promise<MiningNewsItem[]> {
  try {
    const { data } = await axios.get("/api/news");
    return data?.data ?? [];
  } catch {
    return [];
  }
}

export function useMiningNews() {
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [isClient, setIsClient] = useState(false);

  // Initialize read IDs from localStorage on mount
  useEffect(() => {
    setIsClient(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setReadIds(new Set(parsed));
        }
      }
    } catch (e) {
      console.error("Failed to load read news IDs from localStorage", e);
    }
  }, []);

  const query = useQuery({
    queryKey: ["mining-news"],
    queryFn: fetchMiningNews,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false,
  });

  const news = query.data ?? [];

  const isRead = useCallback(
    (id: string) => {
      if (!isClient) return false;
      return readIds.has(id);
    },
    [isClient, readIds]
  );

  const markRead = useCallback((id: string) => {
    setReadIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch (e) {
        console.error("Failed to save read news IDs", e);
      }
      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    if (!news.length) return;
    const allIds = news.map((item) => item.id);
    setReadIds(new Set(allIds));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allIds));
    } catch (e) {
      console.error("Failed to save read news IDs", e);
    }
  }, [news]);

  const unreadCount = isClient
    ? news.filter((item) => !readIds.has(item.id)).length
    : 0;

  return {
    news,
    isLoading: query.isLoading,
    unreadCount,
    isRead,
    markRead,
    markAllRead,
    refetch: query.refetch,
  };
}

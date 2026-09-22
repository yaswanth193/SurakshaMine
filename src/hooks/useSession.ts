"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { UserSession, UserRole } from "@/lib/permissions";

const SESSION_CACHE_KEY = "suraksha_session_cache";

function getCachedSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = localStorage.getItem(SESSION_CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch {
    // ignore
  }
  return null;
}

export function useSession() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setSession(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem(SESSION_CACHE_KEY);
        }
        setLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("name, role, mine_id, mines(name)")
        .eq("id", user.id)
        .single();

      if (profile) {
        const mineName = (profile as any).mines?.name ?? (profile.mine_id ? "Mine A" : undefined);
        const newSession: UserSession = {
          userId: user.id,
          name: profile.name,
          email: user.email!,
          role: profile.role as UserRole,
          mineId: profile.mine_id ?? undefined,
          mineName,
          loginTimestamp: Date.now(),
        };
        setSession(newSession);
        if (typeof window !== "undefined") {
          localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(newSession));
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cached = getCachedSession();
    if (cached) {
      setSession(cached);
      setLoading(false);
    }
    loadProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = async (email: string, password: string) => {
    const res = await supabase.auth.signInWithPassword({ email, password });
    if (!res.error) {
      await loadProfile();
    }
    return res;
  };

  const signOut = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(SESSION_CACHE_KEY);
    }
    setSession(null);
    return supabase.auth.signOut();
  };

  return { session, loading, signIn, signOut };
}

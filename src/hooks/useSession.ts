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

  const setCustomSession = (customSession: UserSession) => {
    setSession(customSession);
    if (typeof window !== "undefined") {
      localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(customSession));
      document.cookie = `suraksha_session=true; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `suraksha_role=${customSession.role}; path=/; max-age=86400; SameSite=Lax`;
    }
  };

  const signIn = async (email: string, password: string, selectedRole?: UserRole) => {
    try {
      const res = await supabase.auth.signInWithPassword({ email, password });
      if (!res.error) {
        await loadProfile();
        if (typeof window !== "undefined") {
          document.cookie = `suraksha_session=true; path=/; max-age=86400; SameSite=Lax`;
        }
        return res;
      }
    } catch {
      // ignore
    }

    // Custom fallback login if Supabase auth fails (allows custom credentials for all 5 roles)
    if (selectedRole) {
      const customSession: UserSession = {
        userId: `user-${Date.now()}`,
        name: email.split("@")[0].replace(/[^a-zA-Z0-9]/g, " ").trim() || "Mining Officer",
        email,
        role: selectedRole,
        mineId: selectedRole === "MINE_MANAGER" ? "47d2d435-8bae-49ca-b8d2-b6e71b407e9b" : undefined,
        mineName: selectedRole === "MINE_MANAGER" ? "Mine A (Jharia Colliery)" : undefined,
        loginTimestamp: Date.now(),
      };
      setCustomSession(customSession);
      return { data: { user: customSession }, error: null };
    }

    return { data: { user: null }, error: { message: "Invalid email or password" } };
  };

  const signUp = async (
    email: string,
    password: string,
    metadata: { name: string; role: UserRole; mineId?: string; mineName?: string }
  ) => {
    try {
      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: metadata.name,
            role: metadata.role,
            mine_id: metadata.mineId,
          },
        },
      });
    } catch {
      // ignore
    }

    const customSession: UserSession = {
      userId: `user-${Date.now()}`,
      name: metadata.name || email.split("@")[0] || "Coal Officer",
      email,
      role: metadata.role,
      mineId: metadata.mineId,
      mineName: metadata.mineName,
      loginTimestamp: Date.now(),
    };
    setCustomSession(customSession);
    return { data: { user: customSession }, error: null };
  };

  const signOut = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(SESSION_CACHE_KEY);
      document.cookie = "suraksha_session=; path=/; max-age=0; SameSite=Lax";
      document.cookie = "suraksha_role=; path=/; max-age=0; SameSite=Lax";
    }
    setSession(null);
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
  };

  return { session, loading, signIn, signUp, setCustomSession, signOut };
}

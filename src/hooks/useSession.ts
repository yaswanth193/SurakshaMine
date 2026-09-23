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

  const loadProfile = async (fallbackRole?: UserRole) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const cached = getCachedSession();

      if (!user) {
        if (cached && cached.role) {
          setSession(cached);
        } else {
          setSession(null);
        }
        setLoading(false);
        return;
      }

      // Supabase user exists!
      let profile: any = null;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("name, role, mine_id, mines(name)")
          .eq("id", user.id)
          .single();
        if (!error && data) {
          profile = data;
        }
      } catch {
        // ignore
      }

      const role: UserRole =
        (profile?.role as UserRole) ||
        (user.user_metadata?.role as UserRole) ||
        fallbackRole ||
        cached?.role ||
        "ADMIN";

      const name: string =
        profile?.name ||
        user.user_metadata?.name ||
        cached?.name ||
        user.email?.split("@")[0].replace(/[^a-zA-Z0-9]/g, " ").trim() ||
        "Mining Officer";

      const mineId: string | undefined =
        profile?.mine_id ||
        user.user_metadata?.mine_id ||
        cached?.mineId ||
        (role === "MINE_MANAGER" ? "47d2d435-8bae-49ca-b8d2-b6e71b407e9b" : undefined);

      const mineName: string | undefined =
        profile?.mines?.name ||
        user.user_metadata?.mine_name ||
        cached?.mineName ||
        (role === "MINE_MANAGER" ? "Mine A (Jharia Opencast Colliery)" : undefined);

      // If profile record was missing in profiles table, create it now so future queries succeed
      if (!profile?.role) {
        try {
          await supabase.from("profiles").upsert({
            id: user.id,
            name,
            role,
            mine_id: mineId || null,
          });
        } catch {
          // ignore
        }
      }

      const newSession: UserSession = {
        userId: user.id,
        name,
        email: user.email || "user@coalmine.gov.in",
        role,
        mineId,
        mineName,
        loginTimestamp: Date.now(),
      };

      setSession(newSession);
      if (typeof window !== "undefined") {
        localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(newSession));
        document.cookie = `suraksha_session=true; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `suraksha_role=${role}; path=/; max-age=86400; SameSite=Lax`;
      }
    } catch {
      const cached = getCachedSession();
      if (cached && cached.role) {
        setSession(cached);
      }
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
      if (!res.error && res.data?.user) {
        await loadProfile(selectedRole);
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
        mineName: selectedRole === "MINE_MANAGER" ? "Mine A (Jharia Opencast Colliery)" : undefined,
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
    let authUserId: string | null = null;
    try {
      const res = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: metadata.name,
            role: metadata.role,
            mine_id: metadata.mineId,
            mine_name: metadata.mineName,
          },
        },
      });

      if (!res.error && res.data?.user) {
        authUserId = res.data.user.id;
        try {
          await supabase.from("profiles").upsert({
            id: res.data.user.id,
            name: metadata.name,
            role: metadata.role,
            mine_id: metadata.mineId || null,
          });
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }

    const activeSession: UserSession = {
      userId: authUserId || `user-${Date.now()}`,
      name: metadata.name || email.split("@")[0] || "Mining Officer",
      email,
      role: metadata.role,
      mineId: metadata.mineId,
      mineName: metadata.mineName,
      loginTimestamp: Date.now(),
    };

    setCustomSession(activeSession);
    return { data: { user: activeSession }, error: null };
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

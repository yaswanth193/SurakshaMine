"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { UserSession, UserRole } from "@/lib/permissions";

export function useSession() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSession(null);
      setLoading(false);
      return;
    }
const { data: profile, error } = await supabase
  .from("profiles")
  .select("name, role, mine_id")
  .eq("id", user.id)
  .single();

console.log("USER ID:", user.id);
console.log("PROFILE:", profile);
console.log("ERROR:", error);
    

    if (profile) {
      setSession({
        userId: user.id,
        name: profile.name,
        email: user.email!,
        role: profile.role as UserRole,
        mineId: profile.mine_id ?? undefined,
        mineName: (profile as any).mines?.name ?? undefined,
        loginTimestamp: Date.now(),
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password });

  const signOut = () => supabase.auth.signOut();

  return { session, loading, signIn, signOut };
}

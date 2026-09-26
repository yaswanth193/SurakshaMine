import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/permissions";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, role } = body as { email: string; role?: UserRole };

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: userList } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    const user = userList?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      return NextResponse.json({ found: false, message: "User not found in auth." });
    }

    // Auto-confirm if needed
    if (!user.email_confirmed_at) {
      await admin.auth.admin.updateUserById(user.id, {
        email_confirm: true,
      });
    }

    // Ensure profile exists in public.profiles table
    const assignedRole = role || (user.user_metadata?.role as UserRole) || "ADMIN";
    const assignedName = user.user_metadata?.name || user.email?.split("@")[0] || "Mining Officer";
    const assignedMineId = user.user_metadata?.mine_id || null;

    await admin.from("profiles").upsert({
      id: user.id,
      name: assignedName,
      role: assignedRole,
      mine_id: assignedMineId,
    });

    return NextResponse.json({
      success: true,
      confirmed: true,
      user: {
        id: user.id,
        email: user.email,
        name: assignedName,
        role: assignedRole,
      },
    });
  } catch (error: any) {
    console.error("API /api/auth/sync error:", error);
    return NextResponse.json(
      { error: error?.message || "Sync encountered an error." },
      { status: 500 }
    );
  }
}

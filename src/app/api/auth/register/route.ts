import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/permissions";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, role, mineId, mineName } = body as {
      email: string;
      password?: string;
      name: string;
      role: UserRole;
      mineId?: string;
      mineName?: string;
    };

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1. Check if user already exists in auth.users
    const { data: userList } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    const existingUser = userList?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      // Auto-confirm the user and update password/metadata
      const updatePayload: any = {
        email_confirm: true,
        user_metadata: {
          name,
          role,
          mine_id: mineId || null,
          mine_name: mineName || null,
        },
      };
      if (password) {
        updatePayload.password = password;
      }
      await admin.auth.admin.updateUserById(existingUser.id, updatePayload);
    } else {
      if (!password || password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters." },
          { status: 400 }
        );
      }
      // Create user with email auto-confirmed
      const { data: newUser, error: createError } =
        await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            name,
            role,
            mine_id: mineId || null,
            mine_name: mineName || null,
          },
        });

      if (createError || !newUser?.user) {
        return NextResponse.json(
          { error: createError?.message || "Failed to register user." },
          { status: 400 }
        );
      }
      userId = newUser.user.id;
    }

    // 2. Ensure profile exists in public.profiles table (admin key bypasses RLS)
    const { error: profileError } = await admin.from("profiles").upsert({
      id: userId,
      name,
      role,
      mine_id: mineId || null,
    });

    if (profileError) {
      console.warn("Profiles upsert notice:", profileError.message);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        name,
        role,
        mineId: mineId || undefined,
        mineName: mineName || undefined,
      },
    });
  } catch (error: any) {
    console.error("API /api/auth/register error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during registration." },
      { status: 500 }
    );
  }
}

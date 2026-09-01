import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

interface SubscribeRequestBody {
  employeeId?: string;
  employeeName?: string;
  mineId?: string;
  subscription?: {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
}

// POST /api/push/subscribe
// Public on purpose — the employee opening this on their own phone
// has no SurakshaMine login. Body shape:
// { employeeId, employeeName, mineId, subscription: { endpoint, keys: { p256dh, auth } } }
// Writes go through the service-role admin client, which is the
// only thing allowed to write this table (see 0003_push_notifications.sql).
export async function POST(request: NextRequest) {
  let body: SubscribeRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { employeeId, employeeName, mineId, subscription } = body ?? {};

  if (!employeeId || typeof employeeId !== "string") {
    return NextResponse.json({ error: "employeeId is required" }, { status: 400 });
  }
  if (!mineId || typeof mineId !== "string") {
    return NextResponse.json({ error: "mineId is required" }, { status: 400 });
  }
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return NextResponse.json({ error: "A valid push subscription is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      employee_id: employeeId,
      employee_name: employeeName ?? null,
      mine_id: mineId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth_key: subscription.keys.auth,
      user_agent: request.headers.get("user-agent") ?? null,
    },
    { onConflict: "employee_id,endpoint" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data: { enrolled: true } }, { status: 201 });
}

// DELETE /api/push/subscribe — an employee can opt out from the
// same device that enrolled.
export async function DELETE(request: NextRequest) {
  let body: { endpoint?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { endpoint } = body ?? {};
  if (!endpoint) {
    return NextResponse.json({ error: "endpoint is required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data: { removed: true } });
}

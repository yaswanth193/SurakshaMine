import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sendPushToSubscription } from "@/lib/push/webpush";

// POST /api/push/send
// Mine Manager (or Admin/Corporate) triggers an incident alert to
// one employee's phone. Body: { employeeId, employeeName?, title,
// message, severity }. The employee must (a) be marked Present by
// the caller on the Employees page, and (b) have enrolled a device
// via /alerts/subscribe — both are enforced by the UI, this route
// enforces the auth + mine-scoping side.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, mine_id, name")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Could not resolve caller profile" }, { status: 403 });
  }

  const allowedRoles = ["MINE_MANAGER", "ADMIN", "CORPORATE_MANAGEMENT"];
  if (!allowedRoles.includes(profile.role)) {
    return NextResponse.json({ error: "Not permitted to send alerts" }, { status: 403 });
  }

  let body: {
    employeeId?: string;
    title?: string;
    message?: string;
    severity?: "low" | "medium" | "high" | "critical";
    mineId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }


  const { employeeId, title, message, severity, mineId: bodyMineId } = body ?? {};
    console.log("SEND DEBUG:", { employeeId, targetMineIdFromProfile: profile.mine_id, bodyMineId });

  if (!employeeId || typeof employeeId !== "string") {
    return NextResponse.json({ error: "employeeId is required" }, { status: 400 });
  }
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  // MINE_MANAGER can only alert employees at their own mine.
  // ADMIN / CORPORATE_MANAGEMENT can target any mine, but must say which.
  const targetMineId = profile.role === "MINE_MANAGER" ? profile.mine_id : bodyMineId;
  if (!targetMineId) {
    return NextResponse.json({ error: "mineId is required for this role" }, { status: 400 });
  }

  // RLS on push_subscriptions (see 0003_push_notifications.sql)
  // already restricts this select to the caller's own mine, so a
  // Mine Manager physically cannot read another mine's rows here.
  // const { data: subscriptions, error: subError } = await supabase
  //   .from("push_subscriptions")
  //   .select("id, endpoint, p256dh, auth_key")
  //   .eq("employee_id", employeeId)
  //   .eq("mine_id", targetMineId);

    const adminSupabaseRead = createAdminClient();
  const { data: subscriptions, error: subError } = await adminSupabaseRead
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth_key")
    .eq("employee_id", employeeId)
    .eq("mine_id", targetMineId);

  console.log("SUBS RESULT:", subscriptions, "ERROR:", subError);
    if (subError) {
    return NextResponse.json({ error: subError.message }, { status: 400 });
  }

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json(
      {
        data: { sent: 0, failed: 0 },
        message:
          "This employee hasn't enrolled a device for alerts yet. Share their enrolment link from the Employees page.",
      },
      { status: 200 }
    );
  }

  const payload = {
    title: title || "SurakshaMine Safety Alert",
    body: message,
    severity: (severity as "low" | "medium" | "high" | "critical") || "medium",
    url: "/incidents",
    tag: `incident-${employeeId}`,
  };

  const results = await Promise.all(
    subscriptions.map((sub) =>
      sendPushToSubscription(
        { id: sub.id, endpoint: sub.endpoint, p256dh: sub.p256dh, auth_key: sub.auth_key },
        payload
      )
    )
  );

  const sent = results.filter((r) => r.ok).length;
  const failed = results.length - sent;
  const expiredIds = results.filter((r) => r.expired).map((r) => r.subscriptionId);

  // Prune dead subscriptions (needs the admin client — RLS above
  // only grants this session SELECT, not DELETE).
  if (expiredIds.length > 0) {
    const adminSupabase = createAdminClient();
    await adminSupabase.from("push_subscriptions").delete().in("id", expiredIds);
  }

  // Best-effort audit trail entry, matching the existing activities feed.
  await supabase.from("activities").insert({
    type: "alert",
    message: `Alert sent to employee ${employeeId}: ${payload.title}`,
    mine_id: targetMineId,
    user_name: profile.name ?? "Mine Manager",
    priority:
      payload.severity === "critical" ? "critical" : payload.severity === "high" ? "high" : "medium",
  });

  return NextResponse.json({ data: { sent, failed } });
}

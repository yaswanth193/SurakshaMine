import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sendPushToSubscription } from "@/lib/push/webpush";
import { resolveMineId } from "@/lib/mineUtils";

// POST /api/push/send
// Mine Manager (or Admin/Corporate) triggers an incident alert to
// one employee's phone, multiple employees, or broadcast to all present employees at a mine.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { role: string; mine_id: string | null; name: string } | null = null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("role, mine_id, name")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  let body: {
    employeeId?: string;
    employeeIds?: string[];
    broadcast?: boolean;
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

  const { employeeId, employeeIds, broadcast, title, message, severity, mineId: bodyMineId } = body ?? {};

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  // Determine target mine
  const targetMineId = resolveMineId(profile?.mine_id || bodyMineId);

  const adminClient = createAdminClient();

  // Multi-target or Broadcast
  if (broadcast || (employeeIds && Array.isArray(employeeIds) && employeeIds.length > 0)) {
    let query = adminClient
      .from("push_subscriptions")
      .select("id, employee_id, endpoint, p256dh, auth_key")
      .eq("mine_id", targetMineId);

    if (employeeIds && employeeIds.length > 0) {
      query = query.in("employee_id", employeeIds);
    }

    const { data: subscriptions, error: subError } = await query;

    if (subError) {
      return NextResponse.json({ error: subError.message }, { status: 400 });
    }

    const targetList = employeeIds && employeeIds.length > 0 ? employeeIds : [];
    const enrolledEmpIds = new Set((subscriptions || []).map((s) => s.employee_id));
    const unenrolledCount = targetList.length > 0 ? targetList.filter((id) => !enrolledEmpIds.has(id)).length : 0;

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        {
          data: { sent: 0, failed: 0, enrolledCount: 0, unenrolledCount: targetList.length || 0 },
          message: "No employees at this mine have enrolled their phone for push alerts yet.",
        },
        { status: 200 }
      );
    }

    const payload = {
      title: title || "SurakshaMine Emergency Broadcast",
      body: message,
      severity: (severity as "low" | "medium" | "high" | "critical") || "high",
      url: "/incidents",
      tag: `broadcast-${Date.now()}`,
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

    if (expiredIds.length > 0) {
      await adminClient.from("push_subscriptions").delete().in("id", expiredIds);
    }

    await adminClient.from("activities").insert({
      type: "alert",
      message: `Emergency broadcast sent to all employees: ${payload.title}`,
      mine_id: targetMineId,
      user_name: profile?.name ?? "Mine Manager",
      priority: payload.severity === "critical" ? "critical" : "high",
    });

    return NextResponse.json({
      data: {
        sent,
        failed,
        enrolledCount: enrolledEmpIds.size,
        unenrolledCount,
        totalSubscriptions: subscriptions.length,
      },
    });
  }

  // Single employee target (backward compatible)
  if (!employeeId || typeof employeeId !== "string") {
    return NextResponse.json({ error: "employeeId or broadcast is required" }, { status: 400 });
  }

  const { data: subscriptions, error: subError } = await adminClient
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth_key")
    .eq("employee_id", employeeId)
    .eq("mine_id", targetMineId);

  if (subError) {
    return NextResponse.json({ error: subError.message }, { status: 400 });
  }

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json(
      {
        data: { sent: 0, failed: 0 },
        message: "This employee hasn't enrolled a device for alerts yet. Share their enrolment link from the Employees page.",
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

  if (expiredIds.length > 0) {
    await adminClient.from("push_subscriptions").delete().in("id", expiredIds);
  }

  await adminClient.from("activities").insert({
    type: "alert",
    message: `Alert sent to employee ${employeeId}: ${payload.title}`,
    mine_id: targetMineId,
    user_name: profile?.name ?? "Mine Manager",
    priority: payload.severity === "critical" ? "critical" : payload.severity === "high" ? "high" : "medium",
  });

  return NextResponse.json({ data: { sent, failed } });
}

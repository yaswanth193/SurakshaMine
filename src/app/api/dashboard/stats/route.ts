import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { DashboardStats } from "@/types/database";

// GET /api/dashboard/stats?mineId=
// Because this uses the cookie-authenticated Supabase client, RLS
// already restricts every query below to whatever rows this user's
// role/mine_id is allowed to see — a Mine Manager's stats are their
// mine's stats, automatically, with no extra filtering code needed.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const mineId = searchParams.get("mineId");

  let minesQuery = supabase.from("mines").select("id, compliance_score, workers_on_site");
  let complianceQuery = supabase
    .from("compliance_items")
    .select("id", { count: "exact", head: true })
    .in("status", ["overdue", "urgent"]);
  let incidentsQuery = supabase
    .from("incidents")
    .select("id", { count: "exact", head: true })
    .in("status", ["reported", "investigating", "action-required"]);
  let inspectionsQuery = supabase
    .from("inspections")
    .select("id", { count: "exact", head: true })
    .in("status", ["scheduled", "pending", "in-progress"]);

  if (mineId && mineId !== "all") {
    minesQuery = minesQuery.eq("id", mineId);
    complianceQuery = complianceQuery.eq("mine_id", mineId);
    incidentsQuery = incidentsQuery.eq("mine_id", mineId);
    inspectionsQuery = inspectionsQuery.eq("mine_id", mineId);
  }

  const [minesRes, complianceRes, incidentsRes, inspectionsRes] = await Promise.all([
    minesQuery,
    complianceQuery,
    incidentsQuery,
    inspectionsQuery,
  ]);

  if (minesRes.error) {
    return NextResponse.json({ error: minesRes.error.message }, { status: 500 });
  }

  const mines = minesRes.data ?? [];
  const totalMines = mines.length;
  const complianceScore = totalMines
    ? Math.round(mines.reduce((sum, m) => sum + m.compliance_score, 0) / totalMines)
    : 0;
  const activeWorkers = mines.reduce((sum, m) => sum + (m.workers_on_site ?? 0), 0);

  const stats: DashboardStats = {
    totalMines,
    complianceScore,
    openViolations: complianceRes.count ?? 0,
    pendingInspections: inspectionsRes.count ?? 0,
    activeWorkers,
    activeIncidentsCount: incidentsRes.count ?? 0,
  };

  return NextResponse.json({ data: stats });
}

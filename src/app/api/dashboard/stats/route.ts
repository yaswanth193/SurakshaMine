import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveMineId } from "@/lib/mineUtils";
import type { DashboardStats } from "@/types/database";

// GET /api/dashboard/stats?mineId=
export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  let mineId = searchParams.get("mineId");
  if (!mineId || mineId === "all" || mineId === "null" || mineId === "undefined") {
    mineId = null;
  }

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

  if (mineId) {
    const safeMineId = resolveMineId(mineId);
    minesQuery = minesQuery.eq("id", safeMineId);
    complianceQuery = complianceQuery.eq("mine_id", safeMineId);
    incidentsQuery = incidentsQuery.eq("mine_id", safeMineId);
    inspectionsQuery = inspectionsQuery.eq("mine_id", safeMineId);
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

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveMineId } from "@/lib/mineUtils";
import type { ActivityRow } from "@/types/database";

// GET /api/activities?mineId=&limit=20
export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  let mineId = searchParams.get("mineId");
  if (!mineId || mineId === "all" || mineId === "null" || mineId === "undefined") {
    mineId = null;
  }
  const limit = Number(searchParams.get("limit") ?? 20);

  let query = supabase
    .from("activities")
    .select("*, mines(name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (mineId) query = query.eq("mine_id", resolveMineId(mineId));

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const shaped: ActivityRow[] = (data ?? []).map((row: any) => ({
    ...row,
    mine_name: row.mines?.name ?? "All Mines",
    mines: undefined,
  }));

  return NextResponse.json({ data: shaped });
}

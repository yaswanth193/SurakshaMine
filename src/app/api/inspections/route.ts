import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveMineId } from "@/lib/mineUtils";
import type { Inspection } from "@/types/database";

// GET /api/inspections?status=&mineId=&search=
export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const mineId = searchParams.get("mineId");
  const search = searchParams.get("search");

  let query = supabase
    .from("inspections")
    .select("*, mines(name, location)")
    .order("inspection_date", { ascending: false });

  if (status && status !== "all") query = query.eq("status", status);
  if (mineId && mineId !== "all" && mineId !== "null" && mineId !== "undefined") {
    query = query.eq("mine_id", resolveMineId(mineId));
  }
  if (search) query = query.or(`title.ilike.%${search}%,inspector_name.ilike.%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const shaped: Inspection[] = (data ?? []).map((row: any) => ({
    ...row,
    mine_name: row.mines?.name,
    mine_location: row.mines?.location,
    mines: undefined,
  }));

  return NextResponse.json({ data: shaped });
}

// POST /api/inspections
export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  const body = await request.json();

  const safeMineId = resolveMineId(body.mineId);

  const { data, error } = await supabase
    .from("inspections")
    .insert({
      title: body.title,
      mine_id: safeMineId,
      zone_name: body.zoneName ?? null,
      inspection_type: body.inspectionType ?? "General",
      inspector_name: body.inspectorName || "Inspector",
      inspection_date: body.inspectionDate || new Date().toISOString().split("T")[0],
      inspection_time: body.inspectionTime || "12:00",
      observation: body.observation ?? "",
      severity: body.severity ?? "low",
      evidence_url: body.evidenceUrl ?? null,
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
      location_source: body.locationSource ?? null,
      remarks: body.remarks ?? null,
      status: body.status ?? "scheduled",
    })
    .select("*, mines(name, location)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const shaped: Inspection = {
    ...(data as any),
    mine_name: (data as any)?.mines?.name,
    mine_location: (data as any)?.mines?.location,
    mines: undefined,
  };

  return NextResponse.json({ data: shaped }, { status: 201 });
}

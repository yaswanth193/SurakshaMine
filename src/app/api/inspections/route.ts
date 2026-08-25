import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Inspection } from "@/types/database";

// GET /api/inspections?status=&mineId=&search=
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const mineId = searchParams.get("mineId");
  const search = searchParams.get("search");

  let query = supabase
    .from("inspections")
    .select("*, mines(name, location)")
    .order("inspection_date", { ascending: false });

  if (status && status !== "all") query = query.eq("status", status);
  if (mineId && mineId !== "all") query = query.eq("mine_id", mineId);
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const { data, error } = await supabase
    .from("inspections")
    .insert({
      title: body.title,
      mine_id: body.mineId,
      zone_name: body.zoneName ?? null,
      inspection_type: body.inspectionType ?? "General",
      inspector_name: body.inspectorName,
      inspection_date: body.inspectionDate,
      inspection_time: body.inspectionTime,
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
  return NextResponse.json({ data }, { status: 201 });
}

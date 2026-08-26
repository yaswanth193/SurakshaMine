import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Incident } from "@/types/database";

// GET /api/incidents?status=&severity=&mineId=&search=
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const severity = searchParams.get("severity");
  const mineId = searchParams.get("mineId");
  const search = searchParams.get("search");

  let query = supabase
    .from("incidents")
    .select("*, mines(name, location)")
    .order("incident_date", { ascending: false })
    .order("incident_time", { ascending: false });

  if (status && status !== "all") query = query.eq("status", status);
  if (severity && severity !== "all") query = query.eq("severity", severity);
  if (mineId && mineId !== "all") query = query.eq("mine_id", mineId);
  if (search) query = query.or(`title.ilike.%${search}%,type.ilike.%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const shaped: Incident[] = (data ?? []).map((row: any) => ({
    ...row,
    mine_name: row.mines?.name,
    mine_location: row.mines?.location,
    mines: undefined,
  }));

  return NextResponse.json({ data: shaped });
}

// POST /api/incidents — GPS lat/lng captured client-side, evidence_url
// points at a file already uploaded to the "evidence" Storage bucket
// via POST /api/evidence.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const status =
    body.severity === "high" || body.severity === "critical" ? "action-required" : "reported";

  const { data, error } = await supabase
    .from("incidents")
    .insert({
      title: body.title,
      type: body.type ?? "other",
      mine_id: body.mineId,
      zone_name: body.zoneName ?? null,
      incident_date: body.incidentDate,
      incident_time: body.incidentTime,
      severity: body.severity ?? "medium",
      description: body.description ?? "",
      reported_by: body.reportedBy,
      immediate_action: body.immediateAction ?? null,
      root_cause: body.rootCause ?? null,
      evidence_url: body.evidenceUrl ?? null,
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
      location_source: body.locationSource ?? null,
      status,
    })
    .select("*, mines(name, location)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}

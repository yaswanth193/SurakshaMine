import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// GET /api/mines
export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("mines").select("*").order("risk_score", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

// POST /api/mines
export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from("mines")
    .insert({
      name: body.name,
      location: body.location,
      type: body.type ?? "underground",
      status: body.status ?? "active",
      risk_score: body.riskScore ?? 0,
      risk_status: body.riskStatus ?? "safe",
      compliance_score: body.complianceScore ?? 100,
      workers_on_site: body.workersOnSite ?? 0,
      zones: body.zones ?? [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}

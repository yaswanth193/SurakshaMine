import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const updates: Record<string, unknown> = {};
  const map: Record<string, string> = {
    title: "title",
    type: "type",
    status: "status",
    severity: "severity",
    description: "description",
    immediateAction: "immediate_action",
    rootCause: "root_cause",
  };
  for (const [key, column] of Object.entries(map)) {
    if (body[key] !== undefined) updates[column] = body[key];
  }

  const { data, error } = await supabase
    .from("incidents")
    .update(updates)
    .eq("id", id)
    .select("*, mines(name, location)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase.from("incidents").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

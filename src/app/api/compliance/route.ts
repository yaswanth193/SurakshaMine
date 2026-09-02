import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ComplianceItem } from "@/types/database";

// GET /api/compliance?status=&mineId=&search=
// RLS already restricts a MINE_MANAGER to their own mine's rows — the
// mineId filter here is just for the "all vs one mine" UI toggle on
// top of whatever rows the DB already allows this user to see.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const mineId = searchParams.get("mineId");
  const search = searchParams.get("search");

  let query = supabase
    .from("compliance_items")
    .select("*, mines(name)")
    .order("due_date", { ascending: true });

  if (status && status !== "all") query = query.eq("status", status);
  if (mineId && mineId !== "all") query = query.eq("mine_id", mineId);
  if (search) query = query.ilike("title", `%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const shaped: ComplianceItem[] = (data ?? []).map((row: any) => ({
    ...row,
    mine_name: row.mines?.name,
    mines: undefined,
  }));

  return NextResponse.json({ data: shaped });
}

// POST /api/compliance
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const { data, error } = await supabase
    .from("compliance_items")
    .insert({
      title: body.title,
      mine_id: body.mineId,
      status: body.status ?? "pending",
      priority: body.priority ?? "medium",
      category: body.category,
      assigned_to: body.assignedTo,
      description: body.description ?? "",
      due_date: body.dueDate,
      document_name: body.documentName ?? null,
    })
    .select("*, mines(name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}

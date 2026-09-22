import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveMineId } from "@/lib/mineUtils";
import type { ComplianceItem } from "@/types/database";

// GET /api/compliance?status=&mineId=&search=
export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const mineId = searchParams.get("mineId");
  const search = searchParams.get("search");

  let query = supabase
    .from("compliance_items")
    .select("*, mines(name)")
    .order("due_date", { ascending: true });

  if (status && status !== "all") query = query.eq("status", status);
  if (mineId && mineId !== "all" && mineId !== "null" && mineId !== "undefined") {
    query = query.eq("mine_id", resolveMineId(mineId));
  }
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
  const supabase = createAdminClient();
  const body = await request.json();

  const safeMineId = resolveMineId(body.mineId);

  const { data, error } = await supabase
    .from("compliance_items")
    .insert({
      title: body.title,
      mine_id: safeMineId,
      status: body.status ?? "pending",
      priority: body.priority ?? "medium",
      category: body.category || "Safety",
      assigned_to: body.assignedTo || "Officer",
      description: body.description ?? "",
      due_date: body.dueDate || new Date().toISOString().split("T")[0],
      document_name: body.documentName ?? null,
    })
    .select("*, mines(name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const shaped: ComplianceItem = {
    ...(data as any),
    mine_name: (data as any)?.mines?.name,
    mines: undefined,
  };

  return NextResponse.json({ data: shaped }, { status: 201 });
}

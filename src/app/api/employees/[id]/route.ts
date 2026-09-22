import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = createAdminClient();

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  const fieldMap: Record<string, string> = {
    name: "name",
    designation: "designation",
    phone: "phone",
    emergencyName: "emergency_name",
    emergency_name: "emergency_name",
    emergencyPhone: "emergency_phone",
    emergency_phone: "emergency_phone",
    shift: "shift",
    bloodGroup: "blood_group",
    blood_group: "blood_group",
    ppeStatus: "ppe_status",
    ppe_status: "ppe_status",
    trainingStatus: "training_status",
    training_status: "training_status",
    medicalCheckupDate: "medical_checkup_date",
    medical_checkup_date: "medical_checkup_date",
    attendance: "attendance",
  };

  for (const [key, column] of Object.entries(fieldMap)) {
    if (body[key] !== undefined) updates[column] = body[key];
  }

  try {
    const { data, error } = await supabase
      .from("employees")
      .update(updates)
      .eq("id", id)
      .select("*, mines(name)")
      .single();

    if (error) {
      return NextResponse.json({ data: { id, ...updates } });
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ data: { id, ...updates } });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = createAdminClient();

  try {
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) {
      console.warn("Delete employee warning:", error.message);
    }
  } catch (err: any) {
    console.warn("Delete employee exception:", err?.message);
  }

  return NextResponse.json({ success: true, id });
}

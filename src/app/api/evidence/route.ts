import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/evidence  (multipart/form-data, field name "file")
// Returns { path, signedUrl } — store `path` on the incident/inspection
// row's evidence_url column, and re-request a fresh signed URL when
// displaying it later (they expire).
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = file.name.split(".").pop();
  const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("evidence")
    .upload(path, file, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 });
  }

  const { data: signed, error: signError } = await supabase.storage
    .from("evidence")
    .createSignedUrl(path, 60 * 60); // 1 hour

  if (signError) {
    return NextResponse.json({ error: signError.message }, { status: 400 });
  }

  return NextResponse.json({ data: { path, signedUrl: signed.signedUrl } }, { status: 201 });
}

// GET /api/evidence?path=... — re-sign an existing evidence path for display
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");
  if (!path) return NextResponse.json({ error: "path is required" }, { status: 400 });

  const { data, error } = await supabase.storage.from("evidence").createSignedUrl(path, 60 * 60);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ data: { signedUrl: data.signedUrl } });
}

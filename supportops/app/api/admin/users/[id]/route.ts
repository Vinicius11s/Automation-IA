import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function assertGovernanca() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return profile?.role === "governanca" ? user : null;
}

const ALLOWED_FIELDS = ["full_name", "role", "department", "active"] as const;

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const actor = await assertGovernanca();
  if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const update = Object.fromEntries(
    Object.entries(body).filter(([k]) => (ALLOWED_FIELDS as readonly string[]).includes(k))
  );

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nenhum campo válido para atualizar" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update(update).eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}

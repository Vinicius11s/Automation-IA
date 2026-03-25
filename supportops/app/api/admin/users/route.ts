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

export async function GET() {
  const actor = await assertGovernanca();
  if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();

  const [{ data: profiles }, { data: { users: authUsers } }] = await Promise.all([
    admin.from("profiles").select("id, full_name, role, department, active, created_at").order("created_at", { ascending: false }),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const emailMap = Object.fromEntries((authUsers ?? []).map((u) => [u.id, u.email ?? null]));
  const result = (profiles ?? []).map((p) => ({ ...p, email: emailMap[p.id] ?? null }));

  return NextResponse.json({ users: result });
}

export async function POST(request: Request) {
  const actor = await assertGovernanca();
  if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { email, password, full_name, role, department } = await request.json();

  if (!email || !password || !full_name || !role || !department) {
    return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message ?? "Erro ao criar usuário" }, { status: 400 });
  }

  const { error: profileError } = await admin
    .from("profiles")
    .insert({ id: authData.user.id, full_name, role, department, active: true });

  if (profileError) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

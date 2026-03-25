import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHash } from "crypto";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const code: string = String(body?.code ?? "")
    .trim()
    .toUpperCase();

  if (!code) {
    return NextResponse.json({ error: "Código obrigatório" }, { status: 400 });
  }

  const hash = createHash("sha256").update(code).digest("hex");
  const admin = createAdminClient();

  // Buscar código pelo hash
  const { data: row } = await admin
    .from("mfa_recovery_codes")
    .select("id, used")
    .eq("user_id", user.id)
    .eq("code_hash", hash)
    .single();

  if (!row) {
    return NextResponse.json({ error: "Código inválido" }, { status: 400 });
  }
  if (row.used) {
    return NextResponse.json({ error: "Este código já foi utilizado" }, { status: 400 });
  }

  // Marcar como usado imediatamente (evita race condition)
  await admin
    .from("mfa_recovery_codes")
    .update({ used: true, used_at: new Date().toISOString() })
    .eq("id", row.id);

  // Remover fator TOTP via Admin REST API
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const factorsRes = await fetch(
    `${supabaseUrl}/auth/v1/admin/users/${user.id}/factors`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    }
  );

  if (factorsRes.ok) {
    type Factor = { id: string; factor_type: string; status: string };
    const raw = await factorsRes.json();
    const factors: Factor[] = Array.isArray(raw) ? raw : (raw.factors ?? []);
    const totp = factors.find(
      (f) => f.factor_type === "totp" && f.status === "verified"
    );
    if (totp) {
      await fetch(
        `${supabaseUrl}/auth/v1/admin/users/${user.id}/factors/${totp.id}`,
        {
          method: "DELETE",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
        }
      );
    }
  }

  // Deletar todos os códigos de recuperação do usuário (2FA foi desativado)
  await admin.from("mfa_recovery_codes").delete().eq("user_id", user.id);

  return NextResponse.json({ success: true });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHash, randomBytes } from "crypto";

function generateCode(): string {
  const hex = randomBytes(8).toString("hex").toUpperCase();
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`;
}

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Confirmar que o 2FA está ativo antes de gerar códigos
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const hasVerified = factors?.totp?.some((f) => f.status === "verified");
  if (!hasVerified) {
    return NextResponse.json({ error: "2FA não está ativo" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Deletar códigos anteriores
  await admin.from("mfa_recovery_codes").delete().eq("user_id", user.id);

  // Gerar 10 novos códigos
  const codes = Array.from({ length: 10 }, generateCode);
  const rows = codes.map((code) => ({
    user_id: user.id,
    code_hash: hashCode(code),
  }));

  const { error } = await admin.from("mfa_recovery_codes").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ codes });
}

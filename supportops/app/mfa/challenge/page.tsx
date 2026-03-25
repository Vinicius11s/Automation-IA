"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, AlertTriangle } from "lucide-react";

export default function MfaChallengePage() {
  const router = useRouter();
  const [mode, setMode] = useState<"totp" | "recovery">("totp");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  async function handleTotpVerify(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) return;
    setError(null);
    setLoading(true);

    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totp = factors?.totp?.find((f) => f.status === "verified");
      if (!totp) throw new Error("Nenhum fator encontrado");

      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({
        factorId: totp.id,
      });
      if (cErr || !challenge) throw cErr ?? new Error("Falha ao criar desafio");

      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId: totp.id,
        challengeId: challenge.id,
        code,
      });
      if (vErr) throw vErr;

      router.push("/");
      router.refresh();
    } catch {
      setError("Código inválido. Tente novamente.");
      setCode("");
    } finally {
      setLoading(false);
    }
  }

  async function handleRecoveryVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/mfa/recovery-codes/use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Código inválido");

      router.push("/");
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Código inválido");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function switchMode(next: "totp" | "recovery") {
    setMode(next);
    setCode("");
    setError(null);
  }

  return (
    <div className="flex-1 bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#111111] border border-[#1a1a1a] mb-4">
            <ShieldCheck className="size-5 text-[#ededed]" />
          </div>
          <h1 className="text-sm font-bold text-[#ededed] tracking-tight">
            RaioX Preditivo Tecnologia
          </h1>
          <p className="text-xs text-[#525252] mt-1">Verificação em dois fatores</p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-[#1a1a1a] bg-[#111111] p-6 flex flex-col gap-5">

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-[#0a0a0a] rounded-lg border border-[#1a1a1a]">
            <button
              onClick={() => switchMode("totp")}
              className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${
                mode === "totp"
                  ? "bg-[#1c1c1c] text-[#ededed] border border-[#262626]"
                  : "text-[#525252] hover:text-[#737373]"
              }`}
            >
              App Autenticador
            </button>
            <button
              onClick={() => switchMode("recovery")}
              className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${
                mode === "recovery"
                  ? "bg-[#1c1c1c] text-[#ededed] border border-[#262626]"
                  : "text-[#525252] hover:text-[#737373]"
              }`}
            >
              Código de Recuperação
            </button>
          </div>

          {/* ── TOTP ── */}
          {mode === "totp" && (
            <form onSubmit={handleTotpVerify} className="flex flex-col gap-4">
              <p className="text-xs text-[#737373]">
                Digite o código de 6 dígitos do seu app autenticador.
              </p>

              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, ""));
                  setError(null);
                }}
                autoFocus
                autoComplete="one-time-code"
                placeholder="000000"
                className="w-full rounded-md border border-[#262626] bg-[#0a0a0a] px-4 py-3 text-center text-2xl font-mono text-[#ededed] tracking-[0.6em] placeholder-[#2a2a2a] focus:outline-none focus:border-[#404040] transition-colors"
              />

              {error && <ErrorMsg text={error} />}

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="rounded-md border border-[#262626] bg-[#1c1c1c] px-4 py-2.5 text-xs font-medium text-[#ededed] hover:bg-[#242424] disabled:opacity-40 transition-colors"
              >
                {loading ? "Verificando..." : "Verificar"}
              </button>
            </form>
          )}

          {/* ── Recovery ── */}
          {mode === "recovery" && (
            <form onSubmit={handleRecoveryVerify} className="flex flex-col gap-4">
              <p className="text-xs text-[#737373]">
                Use um dos seus códigos de recuperação. Ele será invalidado após o uso e o 2FA será desativado.
              </p>

              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                autoFocus
                spellCheck={false}
                className="w-full rounded-md border border-[#262626] bg-[#0a0a0a] px-3 py-2.5 text-sm font-mono text-[#ededed] placeholder-[#2a2a2a] tracking-wider focus:outline-none focus:border-[#404040] transition-colors uppercase"
              />

              <div className="flex items-start gap-2 p-3 rounded-md bg-[#1a1200] border border-[#3a2800]">
                <AlertTriangle className="size-3 text-[#f59e0b] mt-0.5 shrink-0" />
                <p className="text-[11px] text-[#92650a]">
                  Cada código é de uso único. Após usar, o 2FA será desativado da sua conta.
                </p>
              </div>

              {error && <ErrorMsg text={error} />}

              <button
                type="submit"
                disabled={loading || !code.trim()}
                className="rounded-md border border-[#262626] bg-[#1c1c1c] px-4 py-2.5 text-xs font-medium text-[#ededed] hover:bg-[#242424] disabled:opacity-40 transition-colors"
              >
                {loading ? "Verificando..." : "Usar código de recuperação"}
              </button>
            </form>
          )}
        </div>

        {/* Sair */}
        <div className="mt-5 text-center">
          <button
            onClick={handleSignOut}
            className="text-xs text-[#3a3a3a] hover:text-[#525252] transition-colors"
          >
            Sair da conta
          </button>
        </div>

      </div>
    </div>
  );
}

function ErrorMsg({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#1a0a0a] border border-[#3b1010]">
      <AlertTriangle className="size-3 text-[#ef4444] shrink-0" />
      <p className="text-[11px] text-[#ef4444]">{text}</p>
    </div>
  );
}

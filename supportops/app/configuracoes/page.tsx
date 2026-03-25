"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth";
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Copy,
  Download,
  Check,
  AlertTriangle,
  RefreshCw,
  Loader2,
} from "lucide-react";

type MfaStatus = "loading" | "inactive" | "active";
type SetupStep = "idle" | "scanning" | "codes";

export default function ConfiguracoesPage() {
  const profile = useAuthStore((s) => s.profile);
  const supabase = createClient();

  const [mfaStatus, setMfaStatus] = useState<MfaStatus>("loading");
  const [setupStep, setSetupStep] = useState<SetupStep>("idle");
  const [enrollData, setEnrollData] = useState<{
    qrCode: string;
    factorId: string;
    secret: string;
  } | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [remainingCodes, setRemainingCodes] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);

  async function loadMfaStatus() {
    setMfaStatus("loading");
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const active = factors?.totp?.some((f) => f.status === "verified") ?? false;
    setMfaStatus(active ? "active" : "inactive");
    if (active) {
      const { count } = await supabase
        .from("mfa_recovery_codes")
        .select("*", { count: "exact", head: true })
        .eq("used", false);
      setRemainingCodes(count ?? 0);
    } else {
      setRemainingCodes(null);
    }
  }

  useEffect(() => {
    void loadMfaStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Ativar 2FA — Passo 1: iniciar enrollment ───
  async function handleStartEnroll() {
    setError(null);
    setLoading(true);
    try {
      // Limpar fatores não-verificados pendentes
      const { data: existing } = await supabase.auth.mfa.listFactors();
      const pending = existing?.totp?.filter((f) => f.status !== "verified") ?? [];
      for (const f of pending) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }

      const { data, error: err } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        issuer: "RaioX Preditivo",
      });
      if (err || !data) throw err ?? new Error("Falha ao iniciar 2FA");

      setEnrollData({
        qrCode: data.totp.qr_code,
        factorId: data.id,
        secret: data.totp.secret,
      });
      setSetupStep("scanning");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao iniciar 2FA");
    } finally {
      setLoading(false);
    }
  }

  // ─── Ativar 2FA — Passo 2: verificar código e gerar recovery codes ───
  async function handleVerifyEnroll() {
    if (!enrollData || verifyCode.length !== 6) return;
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.mfa.challengeAndVerify({
        factorId: enrollData.factorId,
        code: verifyCode,
      });
      if (err) throw err;

      const res = await fetch("/api/mfa/recovery-codes/generate", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao gerar códigos de recuperação");

      setRecoveryCodes(data.codes);
      setSetupStep("codes");
      setVerifyCode("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Código inválido. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  // ─── Concluir setup ───
  async function handleFinishSetup() {
    setSetupStep("idle");
    setEnrollData(null);
    setRecoveryCodes(null);
    await loadMfaStatus();
  }

  // ─── Desativar 2FA ───
  async function handleDisable() {
    setError(null);
    setLoading(true);
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totp = factors?.totp?.find((f) => f.status === "verified");
      if (!totp) throw new Error("Nenhum fator encontrado");

      const { error: err } = await supabase.auth.mfa.unenroll({
        factorId: totp.id,
      });
      if (err) throw err;

      setShowDisableConfirm(false);
      setRecoveryCodes(null);
      await loadMfaStatus();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao desativar 2FA");
    } finally {
      setLoading(false);
    }
  }

  // ─── Regenerar códigos de recuperação ───
  async function handleRegenerate() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/mfa/recovery-codes/generate", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao regenerar códigos");
      setRecoveryCodes(data.codes);
      setShowRegenConfirm(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao regenerar");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(text: string) {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    if (!recoveryCodes) return;
    const txt = [
      "Códigos de Recuperação — RaioX Preditivo Tecnologia",
      `Gerados em: ${new Date().toLocaleString("pt-BR")}`,
      "",
      ...recoveryCodes,
      "",
      "ATENÇÃO: Cada código só pode ser usado uma vez.",
      "Guarde em local seguro e nunca compartilhe.",
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([txt], { type: "text/plain" }));
    a.download = "codigos-recuperacao-2fa.txt";
    a.click();
  }

  const DEPT: Record<string, string> = {
    suporte: "Suporte / Atendimento",
    financeiro: "Financeiro",
    marketing: "Marketing / Vendas",
  };
  const ROLE: Record<string, string> = {
    governanca: "Governança",
    usuario: "Usuário",
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-8 py-10 flex flex-col gap-8">

        {/* Header */}
        <div>
          <h1 className="text-base font-semibold text-[#ededed]">Configurações</h1>
          <p className="text-xs text-[#525252] mt-0.5">Gerencie sua conta e segurança</p>
        </div>

        {/* ── Perfil ── */}
        <section className="flex flex-col gap-3">
          <SectionLabel>Perfil</SectionLabel>
          <div className="rounded-lg border border-[#1a1a1a] bg-[#111111] divide-y divide-[#1a1a1a]">
            <ProfileRow label="Nome" value={profile?.full_name ?? "—"} />
            <ProfileRow
              label="Departamento"
              value={DEPT[profile?.department ?? ""] ?? profile?.department ?? "—"}
            />
            <ProfileRow
              label="Nível de acesso"
              value={ROLE[profile?.role ?? ""] ?? profile?.role ?? "—"}
            />
          </div>
        </section>

        {/* ── Segurança ── */}
        <section className="flex flex-col gap-3">
          <SectionLabel>Segurança</SectionLabel>

          <div className="rounded-lg border border-[#1a1a1a] bg-[#111111] overflow-hidden">

            {/* Header do card MFA */}
            <div className="flex items-start gap-4 p-5">
              <div
                className={`mt-0.5 p-2 rounded-lg border shrink-0 ${
                  mfaStatus === "active"
                    ? "bg-[#071a07] border-[#143014]"
                    : "bg-[#111] border-[#1a1a1a]"
                }`}
              >
                {mfaStatus === "active" ? (
                  <ShieldCheck className="size-4 text-[#22c55e]" />
                ) : (
                  <Shield className="size-4 text-[#525252]" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-sm font-medium text-[#ededed]">
                    Autenticação de Dois Fatores
                  </span>
                  {mfaStatus === "active" && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#071a07] text-[#22c55e] border border-[#143014]">
                      Ativo
                    </span>
                  )}
                  {mfaStatus === "loading" && (
                    <Loader2 className="size-3 text-[#525252] animate-spin" />
                  )}
                </div>
                <p className="text-xs text-[#525252]">
                  {mfaStatus === "active"
                    ? `Protegido com app autenticador · ${remainingCodes ?? "..."} ${remainingCodes === 1 ? "código" : "códigos"} de recuperação restante${remainingCodes === 1 ? "" : "s"}`
                    : "Adicione uma camada extra de segurança exigindo um código do app autenticador no login."}
                </p>
              </div>
            </div>

            {/* ── Estado: inativo + idle ── */}
            {mfaStatus === "inactive" && setupStep === "idle" && (
              <div className="px-5 pb-5 border-t border-[#1a1a1a] pt-4 flex flex-col gap-3">
                {error && <ErrorBox msg={error} />}
                <button
                  onClick={handleStartEnroll}
                  disabled={loading}
                  className="self-start flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#ededed] bg-[#1c1c1c] border border-[#262626] rounded-md hover:bg-[#242424] disabled:opacity-40 transition-colors"
                >
                  {loading ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <ShieldCheck className="size-3" />
                  )}
                  Ativar 2FA
                </button>
              </div>
            )}

            {/* ── Passo 1: QR Code ── */}
            {setupStep === "scanning" && enrollData && (
              <div className="px-5 pb-5 border-t border-[#1a1a1a] pt-5 flex flex-col gap-5">
                <div>
                  <p className="text-xs font-medium text-[#ededed] mb-1">
                    1. Escaneie com o app autenticador
                  </p>
                  <p className="text-xs text-[#525252] mb-4">
                    Abra o Google Authenticator, Authy ou qualquer app TOTP e
                    escaneie o código abaixo.
                  </p>
                  <div className="flex gap-6 items-start flex-wrap">
                    {/* QR code */}
                    <div className="p-3 bg-white rounded-lg shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={enrollData.qrCode}
                        alt="QR Code para 2FA"
                        width={140}
                        height={140}
                      />
                    </div>
                    {/* Chave manual */}
                    <div className="flex flex-col gap-2">
                      <p className="text-[11px] text-[#525252]">
                        Ou adicione a chave manualmente:
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-[#a1a1aa] bg-[#0a0a0a] border border-[#262626] px-2.5 py-1.5 rounded-md break-all select-all">
                          {enrollData.secret}
                        </code>
                        <button
                          onClick={() => handleCopy(enrollData.secret)}
                          title="Copiar chave"
                          className="p-1.5 rounded-md border border-[#262626] hover:border-[#404040] transition-colors shrink-0"
                        >
                          {copied ? (
                            <Check className="size-3 text-[#22c55e]" />
                          ) : (
                            <Copy className="size-3 text-[#525252]" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-[#ededed] mb-1">
                    2. Digite o código gerado
                  </p>
                  <div className="flex gap-3 items-center flex-wrap">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={verifyCode}
                      onChange={(e) => {
                        setVerifyCode(e.target.value.replace(/\D/g, ""));
                        setError(null);
                      }}
                      placeholder="000000"
                      autoFocus
                      autoComplete="one-time-code"
                      className="w-32 rounded-md border border-[#262626] bg-[#0a0a0a] px-3 py-2 text-center text-lg font-mono text-[#ededed] tracking-[0.4em] placeholder-[#2a2a2a] focus:outline-none focus:border-[#404040] transition-colors"
                    />
                    <button
                      onClick={handleVerifyEnroll}
                      disabled={loading || verifyCode.length !== 6}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#ededed] bg-[#1c1c1c] border border-[#262626] rounded-md hover:bg-[#242424] disabled:opacity-40 transition-colors"
                    >
                      {loading && <Loader2 className="size-3 animate-spin" />}
                      Verificar e ativar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSetupStep("idle");
                        setEnrollData(null);
                        setError(null);
                        setVerifyCode("");
                      }}
                      className="text-xs text-[#525252] hover:text-[#737373] transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                  {error && <ErrorBox msg={error} className="mt-3" />}
                </div>
              </div>
            )}

            {/* ── Passo 2: Códigos de recuperação (setup) ── */}
            {setupStep === "codes" && recoveryCodes && (
              <div className="px-5 pb-5 border-t border-[#1a1a1a] pt-5 flex flex-col gap-4">
                <div className="flex items-start gap-3 p-3 rounded-md bg-[#071a07] border border-[#143014]">
                  <ShieldCheck className="size-4 text-[#22c55e] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-[#22c55e] mb-0.5">
                      2FA ativado com sucesso!
                    </p>
                    <p className="text-xs text-[#4a8a4a]">
                      Guarde os códigos de recuperação abaixo em local seguro.
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-[#ededed] mb-1">
                    Códigos de recuperação
                  </p>
                  <p className="text-xs text-[#525252] mb-3">
                    Use um desses códigos caso perca acesso ao seu app autenticador.
                    Cada código pode ser usado apenas uma vez.
                  </p>
                  <RecoveryCodesGrid codes={recoveryCodes} />
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleCopy(recoveryCodes.join("\n"))}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#ededed] bg-[#1c1c1c] border border-[#262626] rounded-md hover:bg-[#242424] transition-colors"
                  >
                    {copied ? (
                      <Check className="size-3 text-[#22c55e]" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                    {copied ? "Copiado!" : "Copiar todos"}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#ededed] bg-[#1c1c1c] border border-[#262626] rounded-md hover:bg-[#242424] transition-colors"
                  >
                    <Download className="size-3" />
                    Baixar .txt
                  </button>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-md bg-[#1a1200] border border-[#3a2800]">
                  <AlertTriangle className="size-3 text-[#f59e0b] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[#92650a]">
                    Estes códigos não serão exibidos novamente. Salve-os antes de
                    continuar.
                  </p>
                </div>

                <button
                  onClick={handleFinishSetup}
                  className="self-start px-4 py-2 text-xs font-medium text-[#ededed] bg-[#1c1c1c] border border-[#262626] rounded-md hover:bg-[#242424] transition-colors"
                >
                  Concluir configuração
                </button>
              </div>
            )}

            {/* ── Estado: ativo + idle ── */}
            {mfaStatus === "active" && setupStep === "idle" && (
              <div className="px-5 pb-5 border-t border-[#1a1a1a] pt-4 flex flex-col gap-4">
                {error && <ErrorBox msg={error} />}

                {/* Novos códigos regenerados */}
                {recoveryCodes && (
                  <div className="flex flex-col gap-3 p-4 rounded-md bg-[#0a0a0a] border border-[#262626]">
                    <p className="text-xs font-medium text-[#ededed]">
                      Novos códigos de recuperação
                    </p>
                    <RecoveryCodesGrid codes={recoveryCodes} />
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleCopy(recoveryCodes.join("\n"))}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#ededed] bg-[#1c1c1c] border border-[#262626] rounded-md hover:bg-[#242424] transition-colors"
                      >
                        {copied ? (
                          <Check className="size-3 text-[#22c55e]" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                        {copied ? "Copiado!" : "Copiar todos"}
                      </button>
                      <button
                        onClick={handleDownload}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#ededed] bg-[#1c1c1c] border border-[#262626] rounded-md hover:bg-[#242424] transition-colors"
                      >
                        <Download className="size-3" />
                        Baixar .txt
                      </button>
                    </div>
                    <div className="flex items-start gap-2 p-3 rounded-md bg-[#1a1200] border border-[#3a2800]">
                      <AlertTriangle className="size-3 text-[#f59e0b] shrink-0 mt-0.5" />
                      <p className="text-[11px] text-[#92650a]">
                        Salve estes códigos agora. Eles não serão exibidos
                        novamente.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setRecoveryCodes(null);
                        void loadMfaStatus();
                      }}
                      className="self-start text-xs text-[#525252] hover:text-[#737373] transition-colors"
                    >
                      Fechar
                    </button>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  {/* Regenerar */}
                  {!showRegenConfirm ? (
                    <button
                      onClick={() => setShowRegenConfirm(true)}
                      disabled={loading}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#737373] bg-[#111] border border-[#1a1a1a] rounded-md hover:border-[#262626] hover:text-[#a1a1aa] disabled:opacity-40 transition-colors"
                    >
                      <RefreshCw className="size-3" />
                      Regenerar códigos
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-[#737373]">
                        Os códigos antigos serão invalidados.
                      </span>
                      <button
                        onClick={handleRegenerate}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#ededed] bg-[#1c1c1c] border border-[#262626] rounded-md hover:bg-[#242424] disabled:opacity-40 transition-colors"
                      >
                        {loading && <Loader2 className="size-3 animate-spin" />}
                        Confirmar
                      </button>
                      <button
                        onClick={() => setShowRegenConfirm(false)}
                        className="text-xs text-[#525252] hover:text-[#737373] transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}

                  {/* Desativar */}
                  {!showDisableConfirm ? (
                    <button
                      onClick={() => setShowDisableConfirm(true)}
                      disabled={loading}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#ef4444] bg-[#111] border border-[#1a1a1a] rounded-md hover:border-[#3b1010] hover:bg-[#140a0a] disabled:opacity-40 transition-colors"
                    >
                      <ShieldOff className="size-3" />
                      Desativar 2FA
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-[#ef4444]">
                        Tem certeza? O 2FA será removido da conta.
                      </span>
                      <button
                        onClick={handleDisable}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#ef4444]/20 border border-[#ef4444]/40 rounded-md hover:bg-[#ef4444]/30 disabled:opacity-40 transition-colors"
                      >
                        {loading && <Loader2 className="size-3 animate-spin" />}
                        Desativar
                      </button>
                      <button
                        onClick={() => setShowDisableConfirm(false)}
                        className="text-xs text-[#525252] hover:text-[#737373] transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-medium text-[#525252] uppercase tracking-widest px-0.5">
      {children}
    </h2>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-xs text-[#525252]">{label}</span>
      <span className="text-xs text-[#a1a1aa]">{value}</span>
    </div>
  );
}

function ErrorBox({ msg, className = "" }: { msg: string; className?: string }) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-md bg-[#1a0a0a] border border-[#3b1010] ${className}`}
    >
      <AlertTriangle className="size-3 text-[#ef4444] shrink-0" />
      <p className="text-[11px] text-[#ef4444]">{msg}</p>
    </div>
  );
}

function RecoveryCodesGrid({ codes }: { codes: string[] }) {
  return (
    <div className="grid grid-cols-2 gap-1.5 p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg">
      {codes.map((code, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-[10px] text-[#2a2a2a] w-4 text-right shrink-0 tabular-nums">
            {i + 1}.
          </span>
          <code className="text-xs font-mono text-[#a1a1aa] tracking-wider select-all">
            {code}
          </code>
        </div>
      ))}
    </div>
  );
}

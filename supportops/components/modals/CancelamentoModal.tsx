"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Zap, Mail, Package, User, AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import type { Ticket } from "@/types";
import { EncaminharModal } from "./EncaminharModal";

interface Props {
  open: boolean;
  onClose: () => void;
  ticket: Ticket;
}

type ConsultaStatus = "idle" | "loading" | "success" | "error";

export interface AutomacaoResponse {
  nome?: string;
  email?: string;
  produtos?: Array<{ nome: string; status?: string; acesso?: string }> | string[];
  acesso_cancelar?: string;
  message?: string;
  error?: string;
  [key: string]: unknown;
}

export function formatResponseAsText(data: AutomacaoResponse): string {
  const lines: string[] = [];
  if (data.nome) lines.push(`Aluno: ${data.nome}`);
  if (data.email) lines.push(`E-mail: ${data.email}`);
  if (Array.isArray(data.produtos) && data.produtos.length > 0) {
    lines.push("Produtos:");
    (data.produtos as Array<{ nome: string; status?: string; acesso?: string } | string>).forEach((p) => {
      if (typeof p === "string") {
        lines.push(`  - ${p}`);
      } else {
        let line = `  - ${p.nome}`;
        if (p.status) line += ` (${p.status})`;
        if (p.acesso) line += ` — ${p.acesso}`;
        lines.push(line);
      }
    });
  }
  if (data.acesso_cancelar) lines.push(`\nAcesso a cancelar: ${data.acesso_cancelar}`);
  if (data.message && lines.length === 0) return data.message;
  if (lines.length === 0) return JSON.stringify(data, null, 2);
  return lines.join("\n");
}

export function CancelamentoModal({ open, onClose, ticket }: Props) {
  const [email, setEmail] = useState(ticket.person ?? "");
  const [consultaStatus, setConsultaStatus] = useState<ConsultaStatus>("idle");
  const [response, setResponse] = useState<AutomacaoResponse | null>(null);
  const [encaminharOpen, setEncaminharOpen] = useState(false);

  async function handleConsultar(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setConsultaStatus("loading");
    setResponse(null);

    try {
      const res = await fetch("/api/automation/cancelamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setConsultaStatus("error");
        setResponse(data);
        return;
      }

      setConsultaStatus("success");
      setResponse(data);
    } catch {
      setConsultaStatus("error");
      setResponse({ error: "Erro de conexão ao acionar automação." });
    }
  }

  function handleClose() {
    setEmail(ticket.person ?? "");
    setConsultaStatus("idle");
    setResponse(null);
    onClose();
  }

  const produtos = (response?.produtos ?? []) as Array<
    { nome: string; status?: string; acesso?: string } | string
  >;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="bg-[#111111] border-[#1a1a1a] shadow-none max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-normal text-[#ededed] flex items-center gap-2">
              <Zap size={13} className="text-[#4ade80]" />
              Automação — Cancelamento / Reembolso
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {/* Overview */}
            <div className="rounded-md border border-[#1a1a1a] bg-[#0a0a0a] p-3 space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-[#525252] font-medium mb-2">
                O que esta automação faz
              </p>
              <div className="flex items-start gap-2">
                <User size={11} className="text-[#525252] mt-0.5 shrink-0" />
                <p className="text-xs text-[#737373] leading-relaxed">
                  Consulta os dados cadastrais do aluno no CRM a partir do e-mail informado.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Package size={11} className="text-[#525252] mt-0.5 shrink-0" />
                <p className="text-xs text-[#737373] leading-relaxed">
                  Retorna os produtos / acessos ativos vinculados àquele e-mail.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle size={11} className="text-[#525252] mt-0.5 shrink-0" />
                <p className="text-xs text-[#737373] leading-relaxed">
                  Indica qual acesso deve ser cancelado ou reembolsado.
                </p>
              </div>
            </div>

            {/* Ticket context */}
            <div className="rounded-md border border-[#1a1a1a] bg-[#0a0a0a] px-3 py-2.5">
              <p className="text-[10px] font-mono text-[#525252] mb-1">
                {ticket.external_id ?? ticket.id}
                {ticket.person ? ` · ${ticket.person}` : ""}
              </p>
              <p className="text-xs text-[#737373] line-clamp-2">{ticket.title}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleConsultar} className="space-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#525252] font-medium mb-2">
                  Dados da automação
                </p>
                <div className="relative">
                  <Mail
                    size={12}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#525252] pointer-events-none"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    required
                    className="w-full rounded-md border border-[#1a1a1a] bg-[#0a0a0a] pl-8 pr-3 py-2
                      text-xs text-[#ededed] placeholder:text-[#3a3a3a]
                      focus:outline-none focus:ring-1 focus:ring-[#262626] focus:border-[#262626]
                      transition-colors"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-3 py-1.5 text-xs text-[#525252] hover:text-[#ededed] transition-colors rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#262626]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={consultaStatus === "loading" || !email.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded text-[#4ade80]
                    bg-[#0a0a0a] border border-[#1a2a1a]
                    hover:bg-[#0f1f0f] disabled:opacity-40
                    transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#262626]"
                >
                  {consultaStatus === "loading" ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <Zap size={11} />
                  )}
                  {consultaStatus === "loading" ? "Consultando..." : "Consultar"}
                </button>
              </div>
            </form>

            {/* Erro */}
            {consultaStatus === "error" && response && (
              <div className="rounded-md border border-[#3b1010] bg-[#0a0a0a] p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertCircle size={11} className="text-[#ef4444]" />
                  <p className="text-[10px] uppercase tracking-widest text-[#525252] font-medium">Erro</p>
                </div>
                <p className="text-xs text-[#ef4444]">{response.error ?? "Erro desconhecido."}</p>
              </div>
            )}

            {/* Resultado */}
            {consultaStatus === "success" && response && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={11} className="text-[#4ade80]" />
                  <p className="text-[10px] uppercase tracking-widest text-[#525252] font-medium">
                    Resultado da consulta
                  </p>
                </div>

                <div className="rounded-md border border-[#1a1a1a] bg-[#0a0a0a] p-3 space-y-3">
                  {(response.nome || response.email) && (
                    <div className="space-y-1">
                      <p className="text-[10px] text-[#525252] mb-1">Aluno</p>
                      {response.nome && (
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-[#525252]">Nome</span>
                          <span className="text-xs text-[#ededed]">{String(response.nome)}</span>
                        </div>
                      )}
                      {response.email && (
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-[#525252]">E-mail</span>
                          <span className="text-xs font-mono text-[#737373]">{String(response.email)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {produtos.length > 0 && (
                    <div>
                      <p className="text-[10px] text-[#525252] mb-1.5">Produtos / Acessos</p>
                      <div className="space-y-1">
                        {produtos.map((produto, i) => {
                          const nome = typeof produto === "string" ? produto : produto.nome;
                          const status_p = typeof produto === "object" ? produto.status : undefined;
                          const acesso = typeof produto === "object" ? produto.acesso : undefined;
                          return (
                            <div key={i} className="flex items-start justify-between gap-2 py-1 border-t border-[#1a1a1a] first:border-0">
                              <span className="text-xs text-[#737373] leading-snug">{nome}</span>
                              <div className="flex gap-1.5 shrink-0">
                                {status_p && <span className="text-[10px] font-mono text-[#525252]">{status_p}</span>}
                                {acesso && <span className="text-[10px] font-mono text-[#525252]">{acesso}</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {response.acesso_cancelar && (
                    <div className="rounded border border-[#3b1010] bg-[#1a0a0a] px-3 py-2">
                      <p className="text-[10px] text-[#525252] mb-1">Acesso a cancelar</p>
                      <p className="text-xs text-[#ef4444]">{String(response.acesso_cancelar)}</p>
                    </div>
                  )}

                  {response.message && !response.nome && !response.email && produtos.length === 0 && (
                    <p className="text-xs text-[#737373] leading-relaxed">{String(response.message)}</p>
                  )}

                  {!response.nome && !response.email && produtos.length === 0 && !response.acesso_cancelar && !response.message && (
                    <pre className="text-[10px] font-mono text-[#525252] whitespace-pre-wrap break-all leading-relaxed max-h-32 overflow-y-auto">
                      {JSON.stringify(response, null, 2)}
                    </pre>
                  )}
                </div>

                {/* Ação: abrir modal de encaminhar */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setEncaminharOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded text-[#ededed]
                      bg-[#1c1c1c] border border-[#262626]
                      hover:bg-[#262626] transition-colors
                      focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#262626]"
                  >
                    <Send size={11} />
                    Encaminhar
                  </button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {response && (
        <EncaminharModal
          open={encaminharOpen}
          onClose={() => setEncaminharOpen(false)}
          mensagemInicial={formatResponseAsText(response)}
          email={email}
        />
      )}
    </>
  );
}

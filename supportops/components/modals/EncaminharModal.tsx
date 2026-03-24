"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Send, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  mensagemInicial: string;
  email: string;
}

type Status = "idle" | "loading" | "sent" | "error";

export function EncaminharModal({ open, onClose, mensagemInicial, email }: Props) {
  const [mensagem, setMensagem] = useState(mensagemInicial);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function handleEncaminhar() {
    if (!mensagem.trim()) return;

    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/automation/encaminhar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagem: mensagem.trim(), email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setError(data.error ?? "Erro ao encaminhar.");
        return;
      }

      setStatus("sent");
    } catch {
      setStatus("error");
      setError("Erro de conexão ao encaminhar.");
    }
  }

  function handleClose() {
    setMensagem(mensagemInicial);
    setStatus("idle");
    setError("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="bg-[#111111] border-[#1a1a1a] shadow-none max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-normal text-[#ededed] flex items-center gap-2">
            <Send size={13} className="text-[#ededed]" />
            Encaminhar ao departamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Contexto */}
          <div className="rounded-md border border-[#1a1a1a] bg-[#0a0a0a] px-3 py-2.5">
            <p className="text-[10px] text-[#525252] mb-0.5">E-mail consultado</p>
            <p className="text-xs font-mono text-[#737373]">{email}</p>
          </div>

          {/* Textarea editável */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-widest text-[#525252] font-medium">
                Mensagem a encaminhar
              </p>
              <span className="text-[10px] text-[#3a3a3a]">editável</span>
            </div>
            <textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              rows={12}
              disabled={status === "sent"}
              className="w-full rounded-md border border-[#1a1a1a] bg-[#0a0a0a] px-3 py-2.5
                text-xs text-[#ededed] placeholder:text-[#3a3a3a] leading-relaxed
                focus:outline-none focus:ring-1 focus:ring-[#262626] focus:border-[#262626]
                resize-none transition-colors font-mono
                disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Mensagem a ser enviada ao departamento responsável via WhatsApp..."
            />
            <p className="text-[10px] text-[#3a3a3a] mt-1">
              Edite o conteúdo antes de encaminhar. Sua automação cuidará do envio via WhatsApp.
            </p>
          </div>

          {/* Feedback */}
          {status === "error" && (
            <div className="rounded-md border border-[#3b1010] bg-[#0a0a0a] p-3 flex items-center gap-2">
              <AlertCircle size={11} className="text-[#ef4444] shrink-0" />
              <p className="text-xs text-[#ef4444]">{error}</p>
            </div>
          )}
          {status === "sent" && (
            <div className="rounded-md border border-[#1a2a1a] bg-[#0a0a0a] p-3 flex items-center gap-2">
              <CheckCircle2 size={11} className="text-[#4ade80] shrink-0" />
              <p className="text-xs text-[#4ade80]">Encaminhado com sucesso. Sua automação cuidará do envio.</p>
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-1.5 text-xs text-[#525252] hover:text-[#ededed] transition-colors rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#262626]"
            >
              {status === "sent" ? "Fechar" : "Cancelar"}
            </button>
            {status !== "sent" && (
              <button
                type="button"
                onClick={handleEncaminhar}
                disabled={status === "loading" || !mensagem.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded text-[#ededed]
                  bg-[#1c1c1c] border border-[#262626]
                  hover:bg-[#262626] disabled:opacity-40
                  transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#262626]"
              >
                {status === "loading" ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <Send size={11} />
                )}
                {status === "loading" ? "Encaminhando..." : "Encaminhar"}
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

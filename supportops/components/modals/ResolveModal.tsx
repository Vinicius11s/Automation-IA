"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useSupportOpsStore } from "@/store/supportops";
import { toast } from "sonner";

export function ResolveModal() {
  const { pendingMove, tickets, confirmMove, cancelMove } = useSupportOpsStore();
  const [copied, setCopied] = useState(false);

  if (!pendingMove || pendingMove.targetColumn !== "resolvido") return null;

  const ticket = tickets[pendingMove.ticketId];
  if (!ticket) return null;

  function handleCopy() {
    navigator.clipboard.writeText(ticket.suggested_response);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleSendAndResolve() {
    confirmMove();
    toast.success(`${ticket.id} resolvido — resposta enviada`);
  }

  function handleResolveOnly() {
    confirmMove();
    toast.success(`${ticket.id} resolvido`);
  }

  return (
    <Dialog open onOpenChange={(v) => !v && cancelMove()}>
      <DialogContent className="bg-[#111111] border-[#1a1a1a] shadow-none max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-normal text-[#ededed]">
            Resolver ticket
          </DialogTitle>
        </DialogHeader>

        {/* Ticket info */}
        <div className="rounded-md border border-[#1a1a1a] bg-[#0a0a0a] px-3 py-2.5">
          <p className="text-[10px] font-mono text-[#525252] mb-1">
            {ticket.id} · {ticket.person}
          </p>
          <p className="text-xs text-[#737373] line-clamp-2">{ticket.title}</p>
        </div>

        {/* Suggested response */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="section-label">Resposta sugerida</p>
            <button
              onClick={handleCopy}
              className="text-[10px] text-[#525252] hover:text-[#737373] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#262626] rounded"
            >
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
          <div className="rounded-md border border-[#1a1a1a] bg-[#0a0a0a] p-3">
            <p className="text-xs text-[#525252] leading-relaxed">
              {ticket.suggested_response}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <button
            onClick={cancelMove}
            className="px-3 py-1.5 text-xs text-[#525252] hover:text-[#ededed] transition-colors rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#262626]"
          >
            Cancelar
          </button>
          <button
            onClick={handleResolveOnly}
            className="px-3 py-1.5 text-xs rounded text-[#737373]
              bg-[#0a0a0a] border border-[#1a1a1a]
              hover:text-[#ededed] hover:border-[#262626]
              transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#262626]"
          >
            Só resolver
          </button>
          <button
            onClick={handleSendAndResolve}
            className="px-3 py-1.5 text-xs rounded text-[#ededed]
              bg-[#1c1c1c] border border-[#262626]
              hover:bg-[#262626] transition-colors
              focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#262626]"
          >
            Enviar e resolver
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

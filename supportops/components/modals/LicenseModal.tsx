"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useSupportOpsStore } from "@/store/supportops";
import { toast } from "sonner";

export function LicenseModal() {
  const { pendingMove, tickets, confirmMove, cancelMove } = useSupportOpsStore();

  if (!pendingMove || pendingMove.targetColumn !== "licenca") return null;

  const ticket = tickets[pendingMove.ticketId];
  if (!ticket) return null;

  function handleConfirm() {
    confirmMove();
    toast.success(`Licença em processamento — ${ticket.person}`);
  }

  return (
    <AlertDialog open>
      <AlertDialogContent className="bg-[#111111] border-[#1a1a1a] shadow-none max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-sm font-normal text-[#ededed]">
            Confirmar liberação de licença
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-[#525252]">
            Mover para a coluna Liberar Licença?
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Ticket details */}
        <div className="rounded-md border border-[#1a1a1a] bg-[#0a0a0a] p-3 space-y-2">
          <p className="text-xs text-[#ededed] leading-snug">{ticket.title}</p>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#525252]">{ticket.person}</span>
            <span className="text-[10px] font-mono text-[#525252] tabular-nums">
              {ticket.time_open} aberto
            </span>
          </div>
        </div>

        {/* Suggested response */}
        <div className="rounded-md border border-[#1a1a1a] bg-[#0a0a0a] p-3">
          <p className="section-label mb-2">Resposta sugerida</p>
          <p className="text-xs text-[#525252] leading-relaxed line-clamp-3">
            {ticket.suggested_response}
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={cancelMove}
            className="text-xs text-[#525252] bg-transparent border-[#1a1a1a] hover:bg-[#161616] hover:text-[#ededed] transition-colors"
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="text-xs text-[#ededed] bg-[#1c1c1c] border border-[#262626] hover:bg-[#262626] transition-colors"
          >
            Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

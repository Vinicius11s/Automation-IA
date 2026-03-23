"use client";

import { useSupportOpsStore } from "@/store/supportops";
import { renderConfirmationTemplate } from "@/lib/utils";
import { useMoveTicket } from "@/hooks/useMoveTicket";

export function MoveConfirmationModal() {
  const { pendingMove, tickets, columns, clearPendingMove } = useSupportOpsStore();
  const { moveTicket } = useMoveTicket();

  if (!pendingMove) return null;

  const ticket = tickets[pendingMove.ticketId];
  const column = columns.find((item) => item.id === pendingMove.targetColumnId);

  if (!ticket || !column) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border border-[#1a1a1a] bg-[#111111] p-4">
        <h3 className="text-sm text-[#ededed]">
          {column.confirmation_title || "Confirmar movimentação"}
        </h3>
        <p className="mt-2 text-xs text-[#a1a1aa]">
          {renderConfirmationTemplate(column.confirmation_message, ticket)}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            className="rounded-md border border-[#262626] px-3 py-2 text-xs text-[#a1a1aa]"
            onClick={clearPendingMove}
          >
            Cancelar
          </button>
          <button
            className="rounded-md border border-[#262626] bg-[#1c1c1c] px-3 py-2 text-xs text-[#ededed]"
            onClick={async () => {
              await moveTicket(ticket.id, column.id, pendingMove.position);
              clearPendingMove();
            }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

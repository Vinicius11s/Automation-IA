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
import type { Ticket } from "@/types";
import { toast } from "sonner";

const TEAM = ["Você", "Lucas S.", "Mariana T.", "Felipe R.", "Ana C."];

interface Props {
  open: boolean;
  onClose: () => void;
  ticket: Ticket;
}

export function AssignModal({ open, onClose, ticket }: Props) {
  const assignTicket = useSupportOpsStore((s) => s.assignTicket);
  const [selected, setSelected] = useState(ticket.assignee ?? "");

  function handleConfirm() {
    if (!selected) return;
    assignTicket(ticket.id, selected);
    toast.success(`Atribuído para ${selected}`);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xs bg-[#111111] border-[#1a1a1a] shadow-none">
        <DialogHeader>
          <DialogTitle className="text-sm font-normal text-[#ededed]">
            Atribuir ticket
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-[#525252] line-clamp-2 -mt-1">
          {ticket.id} — {ticket.title}
        </p>

        <div className="flex flex-col gap-0.5 mt-1">
          {TEAM.map((name) => (
            <button
              key={name}
              onClick={() => setSelected(name)}
              className={`w-full text-left px-3 py-2 rounded text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#262626]
                ${
                  selected === name
                    ? "bg-[#1c1c1c] text-[#ededed] border border-[#262626]"
                    : "text-[#737373] hover:bg-[#161616] hover:text-[#ededed] border border-transparent"
                }`}
            >
              {name}
            </button>
          ))}
        </div>

        <DialogFooter className="gap-2 mt-1">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-[#525252] hover:text-[#ededed] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#262626] rounded"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selected}
            className="px-3 py-1.5 text-xs rounded text-[#ededed]
              bg-[#1c1c1c] border border-[#262626]
              hover:bg-[#262626] disabled:opacity-30 disabled:cursor-not-allowed
              transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#262626]"
          >
            Atribuir
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import type { Ticket } from "@/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { categoryLabel, sourceLabel } from "@/lib/utils";
import { TicketSheet } from "./TicketSheet";
import { useSupportOpsStore } from "@/store/supportops";
import { CancelamentoModal } from "@/components/modals/CancelamentoModal";
import { Trash2, Zap } from "lucide-react";

interface Props {
  ticket: Ticket;
  index: number;
}

// Priority dot — only urgent and high show anything
function PriorityDot({ priority }: { priority: Ticket["priority"] }) {
  if (priority === "urgent") {
    return (
      <Tooltip>
        <TooltipTrigger>
          <div
            className="size-1.5 rounded-full bg-[#ef4444] shrink-0"
            aria-label="Urgente"
          />
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Urgente</p>
        </TooltipContent>
      </Tooltip>
    );
  }
  if (priority === "high") {
    return (
      <Tooltip>
        <TooltipTrigger>
          <div
            className="size-1.5 rounded-full bg-[#737373] shrink-0"
            aria-label="Alta prioridade"
          />
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Alta</p>
        </TooltipContent>
      </Tooltip>
    );
  }
  return null;
}

export function TicketCard({ ticket, index }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [firing, setFiring] = useState(false);
  const [cancelamentoOpen, setCancelamentoOpen] = useState(false);
  const updateTicket = useSupportOpsStore((state) => state.updateTicket);
  const deleteTicket = useSupportOpsStore((state) => state.deleteTicket);
  const columns = useSupportOpsStore((state) => state.columns);

  const currentColumn = columns.find((col) => col.id === ticket.column_id);
  const isCancelamentoColumn =
    currentColumn?.title?.toLowerCase().includes("cancelamento") ?? false;

  async function handleFireWebhook(event: React.MouseEvent) {
    event.stopPropagation();

    if (isCancelamentoColumn) {
      setCancelamentoOpen(true);
      return;
    }

    setFiring(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/webhook`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) alert(data.error ?? "Erro ao acionar automação");
    } finally {
      setFiring(false);
    }
  }

  return (
    <>
      <Draggable draggableId={ticket.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            data-dragging={snapshot.isDragging}
            className="ticket-card rounded-md border border-[#1a1a1a] bg-[#111111] p-4 cursor-grab active:cursor-grabbing select-none"
            onDoubleClick={() => setEditOpen(true)}
          >
            {/* Row 1: source + external_id + priority dot */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] text-[#525252] truncate">
                  {sourceLabel(ticket.source)}
                </span>
                {ticket.external_id && (
                  <span className="text-[10px] font-mono text-[#525252] shrink-0">
                    #{ticket.external_id}
                  </span>
                )}
              </div>
              <PriorityDot priority={ticket.priority} />
            </div>

            {/* Title */}
            <p className="text-sm text-[#ededed] leading-snug mb-3 line-clamp-2">
              {ticket.title}
            </p>

            {/* Row 3: person + time */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#525252] truncate max-w-[60%]">
                {ticket.person}
              </span>
              <span className="text-[10px] font-mono text-[#525252] tabular-nums shrink-0">
                {ticket.time_open}
              </span>
            </div>

            {/* Row 4: category + actions */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#525252]">
                {categoryLabel(ticket.category)}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleFireWebhook}
                  disabled={firing}
                  className="flex items-center gap-1 rounded border border-[#1a2a1a] px-2 py-1 text-[10px] text-[#4ade80] hover:bg-[#0f1f0f] disabled:opacity-40 transition-colors"
                  title="Acionar automação desta coluna"
                >
                  <Zap size={10} />
                  {firing ? "..." : "Automação"}
                </button>
                <button
                  onClick={async (event) => {
                    event.stopPropagation();
                    const label = ticket.external_id ?? ticket.id;
                    const confirmed = window.confirm(
                      `Excluir ticket ${label}? Esta ação não pode ser desfeita.`
                    );
                    if (confirmed) {
                      await deleteTicket(ticket.id);
                    }
                  }}
                  className="flex items-center gap-1 rounded border border-[#3b1010] px-2 py-1 text-[10px] text-[#ef4444] hover:bg-[#3b1010] hover:text-[#f87171] transition-colors"
                >
                  <Trash2 size={10} />
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}
      </Draggable>

      <TicketSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={ticket}
        title={`Editar ticket ${ticket.external_id ?? ticket.id}`}
        onSubmit={async (payload) => {
          await updateTicket(ticket.id, payload);
        }}
      />

      <CancelamentoModal
        open={cancelamentoOpen}
        onClose={() => setCancelamentoOpen(false)}
        ticket={ticket}
      />
    </>
  );
}

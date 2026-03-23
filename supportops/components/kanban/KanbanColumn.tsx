"use client";

import { useState } from "react";
import { Droppable } from "@hello-pangea/dnd";
import type { KanbanColumn as KanbanColumnType, Ticket } from "@/types";
import { TicketCard } from "./TicketCard";
import { cn, indicatorColorMap } from "@/lib/utils";
import { CreateColumnSheet } from "./CreateColumnSheet";
import { TicketSheet } from "./TicketSheet";
import { useSupportOpsStore } from "@/store/supportops";

interface Props {
  column: KanbanColumnType;
  tickets: Ticket[];
}

export function KanbanColumn({ column, tickets }: Props) {
  const [showEdit, setShowEdit] = useState(false);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const updateColumn = useSupportOpsStore((state) => state.updateColumn);
  const deleteColumn = useSupportOpsStore((state) => state.deleteColumn);
  const createTicket = useSupportOpsStore((state) => state.createTicket);

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Column header */}
      <div className="px-1 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="size-2 rounded-full shrink-0"
            style={{ backgroundColor: indicatorColorMap[column.indicator_color] }}
          />
          <span className="text-xs font-medium text-[#ededed] tracking-wide">
            {column.title}
          </span>
          <span className="text-[10px] font-mono text-[#525252] tabular-nums">
            {tickets.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="rounded border border-[#262626] px-1.5 py-0.5 text-[10px] text-[#a1a1aa]"
            onClick={() => setShowCreateTicket(true)}
          >
            +
          </button>
          <button
            className="rounded border border-[#262626] px-1.5 py-0.5 text-[10px] text-[#a1a1aa]"
            onClick={() => setShowEdit(true)}
          >
            ...
          </button>
        </div>
      </div>

      {/* Droppable area */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 overflow-y-auto flex flex-col gap-2 min-h-16 rounded-md p-1 transition-colors duration-100 scrollbar-none",
              snapshot.isDraggingOver && "bg-[#111111]"
            )}
            style={{ maxHeight: "calc(100vh - 120px)" }}
          >
            {tickets.map((ticket, index) => (
              <TicketCard key={ticket.id} ticket={ticket} index={index} />
            ))}
            {provided.placeholder}
            {tickets.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex items-center justify-center min-h-16 rounded-md border border-dashed border-[#1a1a1a]">
                <p className="text-[10px] text-[#525252]">vazia</p>
              </div>
            )}
          </div>
        )}
      </Droppable>

      <CreateColumnSheet
        open={showEdit}
        onClose={() => setShowEdit(false)}
        initial={column}
        title={`Editar coluna: ${column.title}`}
        onSubmit={async (payload) => {
          await updateColumn(column.id, payload);
        }}
      />

      <TicketSheet
        open={showCreateTicket}
        onClose={() => setShowCreateTicket(false)}
        title={`Novo ticket em ${column.title}`}
        columnId={column.id}
        onSubmit={async (payload) => {
          await createTicket({ ...payload, column_id: column.id });
        }}
      />

      {showEdit && (
        <button
          className="mt-2 rounded-md border border-[#5b1010] px-3 py-2 text-xs text-[#ef4444]"
          onClick={async () => {
            const confirmed = window.confirm(
              `Excluir esta coluna moverá ${tickets.length} tickets para Triagem. Confirma?`
            );
            if (confirmed) {
              await deleteColumn(column.id);
              setShowEdit(false);
            }
          }}
        >
          Excluir coluna
        </button>
      )}
    </div>
  );
}

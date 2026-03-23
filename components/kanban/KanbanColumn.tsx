"use client";

import { Droppable } from "@hello-pangea/dnd";
import type { KanbanColumn as KanbanColumnType, Ticket } from "@/types";
import { TicketCard } from "./TicketCard";
import { cn } from "@/lib/utils";

interface Props {
  column: KanbanColumnType;
  tickets: Ticket[];
}

export function KanbanColumn({ column, tickets }: Props) {
  return (
    <div className="flex flex-col w-64 shrink-0">
      {/* Column header */}
      <div className="px-1 pb-2 flex items-center justify-between">
        <span className="section-label">{column.label}</span>
        <span className="text-[10px] font-mono text-[#525252] tabular-nums">
          {tickets.length}
        </span>
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
    </div>
  );
}

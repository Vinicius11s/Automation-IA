"use client";

import { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import type { Ticket } from "@/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { categoryLabel, sourceLabel } from "@/lib/utils";
import { AssignModal } from "@/components/modals/AssignModal";

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
  const [assignOpen, setAssignOpen] = useState(false);

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
          >
            {/* Row 1: source + id + priority dot */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-mono text-[#525252] shrink-0">
                  {ticket.id}
                </span>
                <span className="text-[10px] text-[#525252] truncate">
                  {sourceLabel(ticket.source)}
                </span>
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

            {/* Row 4: category + assignee */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#525252]">
                {categoryLabel(ticket.category)}
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setAssignOpen(true);
                }}
                aria-label={
                  ticket.assignee
                    ? `Atribuído a ${ticket.assignee}`
                    : "Atribuir ticket"
                }
                className="text-[10px] text-[#525252] hover:text-[#737373] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#262626] rounded"
              >
                {ticket.assignee ? ticket.assignee : "Atribuir"}
              </button>
            </div>
          </div>
        )}
      </Draggable>

      <AssignModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        ticket={ticket}
      />
    </>
  );
}

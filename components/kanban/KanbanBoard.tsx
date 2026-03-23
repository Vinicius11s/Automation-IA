"use client";

import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { useSupportOpsStore } from "@/store/supportops";
import { KanbanColumn } from "./KanbanColumn";
import { LicenseModal } from "@/components/modals/LicenseModal";
import { ResolveModal } from "@/components/modals/ResolveModal";
import type { KanbanColumnId } from "@/types";

export function KanbanBoard() {
  const { columns, tickets, moveTicket, reorderInColumn } =
    useSupportOpsStore();

  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const fromCol = source.droppableId as KanbanColumnId;
    const toCol = destination.droppableId as KanbanColumnId;

    if (fromCol === toCol) {
      // Reorder within same column
      reorderInColumn(fromCol, source.index, destination.index);
      return;
    }

    moveTicket(draggableId, fromCol, toCol, destination.index);
  }

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 px-5 pt-5 pb-6 overflow-x-auto h-full scrollbar-thin">
          {columns.map((col) => {
            const colTickets = col.ticketIds
              .map((id) => tickets[id])
              .filter(Boolean);
            return (
              <KanbanColumn key={col.id} column={col} tickets={colTickets} />
            );
          })}
        </div>
      </DragDropContext>

      {/* Automation modals */}
      <LicenseModal />
      <ResolveModal />
    </>
  );
}

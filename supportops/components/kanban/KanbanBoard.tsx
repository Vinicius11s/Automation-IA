"use client";

import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { useSupportOpsStore } from "@/store/supportops";
import { KanbanColumn } from "./KanbanColumn";
import { MoveConfirmationModal } from "./MoveConfirmationModal";
import { useMoveTicket } from "@/hooks/useMoveTicket";
import { useColumns } from "@/hooks/useColumns";
import { useTickets } from "@/hooks/useTickets";

export function KanbanBoard() {
  const { columns, tickets, askConfirmationMove } = useSupportOpsStore();
  const { moveTicket } = useMoveTicket();
  useColumns();
  useTickets();

  async function onDragEnd(result: DropResult) {
    const { destination, draggableId } = result;
    if (!destination) return;

    const toCol = destination.droppableId;

    const targetColumn = columns.find((column) => column.id === toCol);
    if (!targetColumn) return;

    if (targetColumn.confirmation_enabled) {
      askConfirmationMove(draggableId, toCol, destination.index);
    } else {
      await moveTicket(draggableId, toCol, destination.index);
    }
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

      <MoveConfirmationModal />
    </>
  );
}

"use client";

import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { useSupportOpsStore } from "@/store/supportops";
import { KanbanColumn } from "./KanbanColumn";
import { MoveConfirmationModal } from "./MoveConfirmationModal";
import { useMoveTicket } from "@/hooks/useMoveTicket";
import { useColumns } from "@/hooks/useColumns";
import { useTickets } from "@/hooks/useTickets";

export function KanbanBoard() {
  const { columns, tickets, askConfirmationMove, reorderColumns } = useSupportOpsStore();
  const { moveTicket } = useMoveTicket();
  useColumns();
  useTickets();

  async function onDragEnd(result: DropResult) {
    const { destination, source, draggableId, type } = result;
    if (!destination) return;

    // Column reorder
    if (type === "COLUMN") {
      if (destination.index === source.index) return;
      await reorderColumns(source.index, destination.index);
      return;
    }

    // Ticket move
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
        <Droppable droppableId="board" type="COLUMN" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex gap-4 px-5 pt-5 pb-6 overflow-x-auto h-full scrollbar-thin"
            >
              {columns.map((col, index) => {
                const colTickets = col.ticketIds
                  .map((id) => tickets[id])
                  .filter(Boolean);
                return (
                  <Draggable key={col.id} draggableId={`col-${col.id}`} index={index}>
                    {(draggableProvided) => (
                      <KanbanColumn
                        column={col}
                        tickets={colTickets}
                        draggableProvided={draggableProvided}
                      />
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <MoveConfirmationModal />
    </>
  );
}

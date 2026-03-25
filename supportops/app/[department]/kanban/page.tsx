import { Dashboard } from "@/components/dashboard/Dashboard";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { KanbanTopBar } from "@/components/kanban/KanbanTopBar";

export default function DeptKanbanPage() {
  return (
    <>
      <Dashboard />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <KanbanTopBar />
        <main className="flex-1 overflow-hidden">
          <KanbanBoard />
        </main>
      </div>
    </>
  );
}

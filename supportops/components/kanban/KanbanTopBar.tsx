"use client";

import { useMemo, useState } from "react";
import { useSupportOpsStore } from "@/store/supportops";
import { CreateColumnSheet } from "./CreateColumnSheet";
import { RefreshCw } from "lucide-react";

export function KanbanTopBar() {
  const [open, setOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const tickets = useSupportOpsStore((state) => state.tickets);
  const createColumn = useSupportOpsStore((state) => state.createColumn);
  const fetchColumns = useSupportOpsStore((state) => state.fetchColumns);
  const fetchTickets = useSupportOpsStore((state) => state.fetchTickets);

  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([fetchColumns(), fetchTickets()]);
    setRefreshing(false);
  }
  const ticketList = useMemo(() => Object.values(tickets), [tickets]);
  const urgentCount = ticketList.filter((ticket) => ticket.priority === "urgent").length;
  const pendingLicenses = ticketList.filter((ticket) => ticket.category === "licenca").length;

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

  return (
    <header className="h-12 shrink-0 flex items-center justify-between px-5 border-b border-[#1a1a1a] bg-[#0a0a0a]">
      <div className="flex items-center gap-4">
        <h1 className="text-sm text-[#ededed]">Kanban</h1>
        <span className="text-xs text-[#525252] font-mono">{today}</span>
      </div>

      <div className="flex items-center gap-3 text-xs font-mono text-[#525252]">
        <span>{ticketList.length} tickets</span>
        {urgentCount > 0 && (
          <>
            <span className="text-[#1a1a1a]">/</span>
            <span className="text-[#ef4444]">
              {urgentCount} urgente{urgentCount > 1 ? "s" : ""}
            </span>
          </>
        )}
        {pendingLicenses > 0 && (
          <>
            <span className="text-[#1a1a1a]">/</span>
            <span>
              {pendingLicenses} lic.
            </span>
          </>
        )}
        <button
          className="rounded border border-[#262626] p-1.5 text-[#a1a1aa] hover:text-[#ededed] disabled:opacity-40"
          onClick={handleRefresh}
          disabled={refreshing}
          title="Atualizar"
        >
          <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
        </button>
        <button
          className="rounded border border-[#262626] px-2 py-1 text-[#ededed]"
          onClick={() => setOpen(true)}
        >
          Nova coluna
        </button>
      </div>

      <CreateColumnSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Criar nova coluna"
        onSubmit={async (payload) => {
          await createColumn(payload);
        }}
      />
    </header>
  );
}

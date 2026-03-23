"use client";

import { useSupportOpsStore } from "@/store/supportops";

export function KanbanTopBar() {
  const { briefing } = useSupportOpsStore();
  const { summary } = briefing;

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
        <span>{summary.total} tickets</span>
        {summary.urgent > 0 && (
          <>
            <span className="text-[#1a1a1a]">/</span>
            <span className="text-[#ef4444]">
              {summary.urgent} urgente{summary.urgent > 1 ? "s" : ""}
            </span>
          </>
        )}
        {summary.pending_licenses > 0 && (
          <>
            <span className="text-[#1a1a1a]">/</span>
            <span>
              {summary.pending_licenses} lic.
            </span>
          </>
        )}
      </div>
    </header>
  );
}

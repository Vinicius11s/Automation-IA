"use client";

import { useEffect, useMemo } from "react";
import { useSupportOpsStore } from "@/store/supportops";
import { ScrollArea } from "@/components/ui/scroll-area";

export function Dashboard() {
  const briefing = useSupportOpsStore((state) => state.briefing);
  const tickets = useSupportOpsStore((state) => state.tickets);
  const fetchBriefing = useSupportOpsStore((state) => state.fetchBriefing);
  const ticketList = useMemo(() => Object.values(tickets), [tickets]);

  useEffect(() => {
    void fetchBriefing();
  }, [fetchBriefing]);

  // Always derive counts from actual tickets — briefing.summary can be stale
  const summary = {
    total: ticketList.length,
    urgent: ticketList.filter((t) => t.priority === "urgent").length,
    academy: ticketList.filter((t) => t.source === "academy").length,
    zendesk: ticketList.filter((t) => t.source === "zendesk").length,
    pending_licenses: ticketList.filter((t) => t.category === "licenca").length,
  };

  const priorities = briefing?.priorities ?? [];
  const claude_analysis = briefing?.claude_analysis ?? "Sem análise gerada ainda.";

  return (
    <aside
      aria-label="Dashboard"
      className="flex flex-col w-64 shrink-0 border-r border-[#1a1a1a] bg-[#0a0a0a] h-screen"
    >
      {/* Logo / title */}
      <div className="px-5 h-12 flex items-center border-b border-[#1a1a1a] shrink-0">
        <span className="text-sm font-semibold text-[#ededed] tracking-tight">
          SupportOps
        </span>
      </div>

      <ScrollArea className="flex-1 scrollbar-none">
        <div className="px-5 py-5 flex flex-col gap-6">

          {/* Summary numbers */}
          <section aria-labelledby="summary-heading">
            <p id="summary-heading" className="section-label mb-3">
              Hoje
            </p>
            <div className="flex flex-col gap-0">
              <SummaryRow label="Total" value={summary.total} />
              <SummaryRow
                label="Urgentes"
                value={summary.urgent}
                urgent={summary.urgent > 0}
              />
              <SummaryRow label="Academy" value={summary.academy} />
              <SummaryRow label="Zendesk" value={summary.zendesk} />
              {summary.pending_licenses > 0 && (
                <SummaryRow
                  label="Lic. pendentes"
                  value={summary.pending_licenses}
                />
              )}
            </div>
          </section>

          <div className="border-t border-[#1a1a1a]" />

          {/* Top priorities */}
          <section aria-labelledby="priorities-heading">
            <p id="priorities-heading" className="section-label mb-3">
              Prioridades
            </p>
            <ol className="flex flex-col gap-3">
              {priorities.map((p, i) => (
                <li key={i} className="flex gap-2.5 items-baseline">
                  <span className="text-[10px] font-mono text-[#525252] shrink-0 tabular-nums">
                    {i + 1}.
                  </span>
                  <span className="text-xs text-[#737373] leading-relaxed">
                    {p}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <div className="border-t border-[#1a1a1a]" />

          {/* Claude analysis */}
          <section aria-labelledby="analysis-heading">
            <p id="analysis-heading" className="section-label mb-3">
              Análise
            </p>
            <p className="text-xs text-[#525252] leading-relaxed">
              {claude_analysis}
            </p>
          </section>
        </div>
      </ScrollArea>
    </aside>
  );
}

// ─── Summary row ──────────────────────────────────────────────────────────────

function SummaryRow({
  label,
  value,
  urgent,
}: {
  label: string;
  value: number;
  urgent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-[#525252]">{label}</span>
      <span
        className={`text-xs font-mono tabular-nums ${
          urgent ? "text-[#ef4444]" : "text-[#ededed]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

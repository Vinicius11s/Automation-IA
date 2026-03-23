"use client";

import { useSupportOpsStore } from "@/store/supportops";
import { formatScanTime } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, RefreshCw } from "lucide-react";

export function Dashboard() {
  const { briefing, isLoading, lastScan, triggerScan } = useSupportOpsStore();
  const { summary, priorities, claude_analysis } = briefing;

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

      {/* Scan footer */}
      <div className="px-5 py-4 border-t border-[#1a1a1a] flex flex-col gap-2 shrink-0">
        <button
          onClick={triggerScan}
          disabled={isLoading}
          aria-label="Rodar scan agora"
          className="w-full flex items-center justify-center gap-2 rounded-md
            px-3 py-2 text-xs text-[#ededed]
            bg-[#111111] border border-[#262626]
            hover:bg-[#161616] hover:border-[#333333]
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors duration-100
            focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#262626]"
        >
          {isLoading ? (
            <Loader2 className="size-3 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="size-3" aria-hidden="true" />
          )}
          {isLoading ? "Coletando…" : "Rodar scan"}
        </button>
        <p className="text-center text-[10px] text-[#525252] font-mono tabular-nums">
          último scan {formatScanTime(lastScan)}
        </p>
      </div>
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

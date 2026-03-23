"use client";

import { useSupportOpsStore } from "@/store/supportops";
import { formatScanTime } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpen,
  Headset,
  Loader2,
  RefreshCw,
  Zap,
} from "lucide-react";

export function AppSidebar() {
  const { briefing, isLoading, lastScan, triggerScan } = useSupportOpsStore();
  const { summary, priorities, claude_analysis } = briefing;

  return (
    <aside className="flex flex-col w-72 shrink-0 border-r border-border bg-[oklch(0.11_0.014_255)] h-screen overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="size-7 rounded bg-[oklch(0.72_0.18_195)] flex items-center justify-center">
            <Headset className="size-4 text-[oklch(0.09_0.012_255)]" />
          </div>
          <span className="text-base font-semibold tracking-tight text-foreground">
            SupportOps
          </span>
        </div>
        <p className="text-xs text-muted-foreground font-mono">
          Painel de suporte automatizado
        </p>
      </div>

      <Separator />

      <ScrollArea className="flex-1 scrollbar-thin">
        <div className="px-5 py-4 flex flex-col gap-5">

          {/* Summary cards */}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">
              Resumo do dia
            </p>
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Total" value={summary.total} color="foreground" />
              <StatCard
                label="Urgentes"
                value={summary.urgent}
                color="urgent"
                highlight={summary.urgent > 0}
              />
              <StatCard label="Academy" value={summary.academy} color="cyan" icon={<BookOpen className="size-3" />} />
              <StatCard label="Zendesk" value={summary.zendesk} color="purple" />
            </div>
            {summary.pending_licenses > 0 && (
              <div className="mt-2 flex items-center gap-2 rounded-md px-3 py-2 bg-[oklch(0.14_0.04_280/0.5)] border border-[oklch(0.7_0.17_280/0.3)]">
                <Zap className="size-3 text-[oklch(0.7_0.17_280)] shrink-0" />
                <span className="text-xs text-[oklch(0.7_0.17_280)]">
                  {summary.pending_licenses} licença{summary.pending_licenses > 1 ? "s" : ""} pendente{summary.pending_licenses > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Priorities */}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">
              Top prioridades
            </p>
            <ol className="flex flex-col gap-2">
              {priorities.map((p, i) => (
                <li key={i} className="flex gap-2.5 items-start">
                  <span
                    className="shrink-0 size-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold mt-0.5"
                    style={{
                      background:
                        i === 0
                          ? "oklch(0.72 0.19 45 / 0.15)"
                          : "oklch(0.18 0.018 255)",
                      color:
                        i === 0
                          ? "oklch(0.72 0.19 45)"
                          : "oklch(0.52 0.02 220)",
                      border: `1px solid ${i === 0 ? "oklch(0.72 0.19 45 / 0.3)" : "oklch(0.22 0.02 255)"}`,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    {p}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <Separator />

          {/* Claude analysis */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Análise Claude
              </p>
              <Badge
                variant="secondary"
                className="text-[9px] px-1.5 py-0 h-4 font-mono"
              >
                AI
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {claude_analysis}
            </p>
          </div>
        </div>
      </ScrollArea>

      {/* Scan button + last scan */}
      <div className="px-5 py-4 border-t border-border flex flex-col gap-2">
        <button
          onClick={triggerScan}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all
            bg-[oklch(0.72_0.18_195/0.12)] text-[oklch(0.72_0.18_195)] border border-[oklch(0.72_0.18_195/0.3)]
            hover:bg-[oklch(0.72_0.18_195/0.2)] hover:border-[oklch(0.72_0.18_195/0.5)]
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          {isLoading ? "Coletando dados..." : "Rodar scan agora"}
        </button>
        <p className="text-center text-[10px] font-mono text-muted-foreground">
          Último scan: {formatScanTime(lastScan)}
        </p>
      </div>
    </aside>
  );
}

// ─── Sub-component ─────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
  highlight,
  icon,
}: {
  label: string;
  value: number;
  color: "foreground" | "urgent" | "cyan" | "purple";
  highlight?: boolean;
  icon?: React.ReactNode;
}) {
  const colorMap = {
    foreground: { text: "text-foreground", bg: "bg-secondary" },
    urgent: {
      text: highlight ? "text-[oklch(0.72_0.19_45)]" : "text-foreground",
      bg: highlight ? "bg-[oklch(0.18_0.04_45/0.5)]" : "bg-secondary",
    },
    cyan: { text: "text-[oklch(0.72_0.18_195)]", bg: "bg-[oklch(0.14_0.04_195/0.5)]" },
    purple: { text: "text-[oklch(0.7_0.17_280)]", bg: "bg-[oklch(0.14_0.04_280/0.5)]" },
  };
  const c = colorMap[color];
  return (
    <div className={`rounded-md px-3 py-2 ${c.bg} border border-border`}>
      <div className={`text-xl font-bold font-mono ${c.text} flex items-center gap-1`}>
        {icon}
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

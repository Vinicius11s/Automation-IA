"use client";

import { useSupportOpsStore } from "@/store/supportops";
import { formatScanTime } from "@/lib/utils";
import { Activity, Calendar } from "lucide-react";

export function TopBar() {
  const { briefing, lastScan } = useSupportOpsStore();

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="h-12 shrink-0 border-b border-border px-5 flex items-center justify-between bg-[oklch(0.10_0.013_255/0.8)] backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-foreground tracking-tight">
          Kanban de Suporte
        </h1>
        <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
          <Calendar className="size-3" />
          {today}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Activity className="size-3 text-[oklch(0.72_0.15_145)]" />
          <span className="text-[11px] font-mono text-muted-foreground">
            {briefing.summary.total} tickets •{" "}
            <span className="text-[oklch(0.72_0.19_45)]">
              {briefing.summary.urgent} urgentes
            </span>
          </span>
        </div>
        <span className="text-[11px] font-mono text-muted-foreground">
          scan {formatScanTime(lastScan)}
        </span>
      </div>
    </header>
  );
}

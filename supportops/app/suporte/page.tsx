"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useSupportOpsStore } from "@/store/supportops";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DateFilter = "today" | "7d" | "30d" | "all";

const FILTER_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "all", label: "Todos" },
];

function getFilterStart(filter: DateFilter): string | null {
  if (filter === "all") return null;
  const d = new Date();
  if (filter === "today") d.setHours(0, 0, 0, 0);
  else if (filter === "7d") d.setDate(d.getDate() - 7);
  else if (filter === "30d") d.setDate(d.getDate() - 30);
  return d.toISOString();
}

const FILTER_ANALYSIS_LABEL: Record<DateFilter, string> = {
  today: "Análise do dia",
  "7d": "Análise — últimos 7 dias",
  "30d": "Análise — últimos 30 dias",
  all: "Análise geral",
};

const statusColors = ["#a1a1aa", "#3b82f6", "#f59e0b", "#22c55e"];

export default function SuportePage() {
  const tickets = useSupportOpsStore((state) => state.tickets);
  const fetchTickets = useSupportOpsStore((state) => state.fetchTickets);
  const briefing = useSupportOpsStore((state) => state.briefing);
  const fetchBriefing = useSupportOpsStore((state) => state.fetchBriefing);

  const [filter, setFilter] = useState<DateFilter>("today");

  useEffect(() => {
    void fetchTickets();
    void fetchBriefing();
  }, [fetchTickets, fetchBriefing]);

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  const allTickets = useMemo(() => Object.values(tickets), [tickets]);

  const ticketList = useMemo(() => {
    const start = getFilterStart(filter);
    if (!start) return allTickets;
    return allTickets.filter((t) => (t.created_at ?? "") >= start);
  }, [allTickets, filter]);

  const urgentCount = ticketList.filter((t) => t.priority === "urgent").length;
  const resolvedCount = ticketList.filter((t) => t.status === "resolved").length;
  const pendingLicenses = ticketList.filter(
    (t) => t.category === "licenca" && t.status !== "resolved"
  ).length;

  const platformData = [
    { name: "Academy", total: ticketList.filter((t) => t.source === "academy").length },
    { name: "Zendesk", total: ticketList.filter((t) => t.source === "zendesk").length },
    { name: "ChatGuru", total: ticketList.filter((t) => t.source === "chatguru").length },
    { name: "Manual", total: ticketList.filter((t) => t.source === "manual").length },
  ].filter((d) => d.total > 0);

  const categoryData = [
    { name: "Bug", total: ticketList.filter((t) => t.category === "bug").length },
    { name: "Licença", total: ticketList.filter((t) => t.category === "licenca").length },
    { name: "FAQ", total: ticketList.filter((t) => t.category === "faq").length },
    { name: "Suporte", total: ticketList.filter((t) => t.category === "suporte").length },
    { name: "Sugestão", total: ticketList.filter((t) => t.category === "sugestao").length },
  ].filter((d) => d.total > 0);

  const volumeDays = filter === "today" ? 1 : filter === "7d" ? 7 : filter === "30d" ? 30 : 30;
  const volumeData = Array.from({ length: Math.min(volumeDays, 30) }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (Math.min(volumeDays, 30) - 1 - i));
    const dayKey = d.toISOString().slice(0, 10);
    return {
      day: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      total: allTickets.filter((t) => (t.created_at ?? "").slice(0, 10) === dayKey).length,
    };
  });

  const statusData = [
    { name: "Aberto", value: ticketList.filter((t) => t.status === "open").length },
    { name: "Em atendimento", value: ticketList.filter((t) => t.status === "in_progress").length },
    { name: "Aguardando", value: ticketList.filter((t) => t.status === "pending").length },
    { name: "Resolvido", value: ticketList.filter((t) => t.status === "resolved").length },
  ].filter((d) => d.value > 0);

  // Analysis text: AI briefing for "today", derived summary for other periods
  const analysisText = useMemo(() => {
    if (filter === "today") return briefing?.claude_analysis ?? null;
    if (ticketList.length === 0) return "Nenhum ticket no período selecionado.";
    const period = filter === "7d" ? "últimos 7 dias" : filter === "30d" ? "últimos 30 dias" : "todo o histórico";
    const cats = categoryData.map((c) => `${c.total} ${c.name.toLowerCase()}`).join(", ");
    return `No período de ${period}: ${ticketList.length} ticket(s) no total — ${urgentCount} urgente(s), ${resolvedCount} resolvido(s). Por categoria: ${cats || "sem dados"}.`;
  }, [filter, briefing, ticketList, urgentCount, resolvedCount, categoryData]);

  const priorities = filter === "today" ? (briefing?.priorities ?? []) : [];

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-8 py-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-base font-semibold text-[#ededed] tracking-tight">
              Suporte / Atendimento
            </h1>
            <p className="mt-0.5 text-xs capitalize text-[#a1a1aa]">{today}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Date filter */}
            <div className="flex items-center rounded-md border border-[#262626] bg-[#111111] p-0.5">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  className={`px-3 py-1 rounded text-xs transition-colors ${
                    filter === opt.value
                      ? "bg-[#262626] text-[#ededed]"
                      : "text-[#525252] hover:text-[#a1a1aa]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <Link
              href="/suporte/kanban"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#ededed] bg-[#111111] border border-[#262626] rounded-md hover:bg-[#161616] transition-colors shrink-0"
            >
              Abrir Kanban
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-4 gap-3">
          <MetricCard label="Total" value={ticketList.length} />
          <MetricCard label="Urgentes" value={urgentCount} urgent={urgentCount > 0} />
          <MetricCard label="Licenças pendentes" value={pendingLicenses} warning />
          <MetricCard label="Resolvidos" value={resolvedCount} />
        </div>

        {/* Analysis */}
        {(analysisText || priorities.length > 0) && (
          <div className="grid grid-cols-2 gap-4">
            {analysisText && (
              <section className="rounded-md border border-[#1a1a1a] bg-[#111111] p-4">
                <p className="section-label mb-2 text-[#71717a]">{FILTER_ANALYSIS_LABEL[filter]}</p>
                <p className="text-xs text-[#737373] leading-relaxed">{analysisText}</p>
              </section>
            )}
            {priorities.length > 0 && (
              <section className="rounded-md border border-[#1a1a1a] bg-[#111111] p-4">
                <p className="section-label mb-2 text-[#71717a]">Top prioridades</p>
                <ol className="flex flex-col gap-2">
                  {priorities.map((p, i) => (
                    <li key={i} className="flex gap-2 items-baseline">
                      <span className="text-[10px] font-mono text-[#525252] shrink-0">{i + 1}.</span>
                      <span className="text-xs text-[#737373] leading-relaxed">{p}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-2 gap-4">
          <ChartCard title="Tickets por plataforma">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={platformData} layout="vertical">
                <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fill: "#a1a1aa", fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#a1a1aa", fontSize: 11 }} width={70} />
                <Tooltip contentStyle={{ background: "#111", border: "1px solid #262626", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#a1a1aa" }} />
                <Bar dataKey="total" name="Tickets" fill="#3b82f6" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Tickets por categoria">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fill: "#a1a1aa", fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#a1a1aa", fontSize: 11 }} width={70} />
                <Tooltip contentStyle={{ background: "#111", border: "1px solid #262626", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#a1a1aa" }} />
                <Bar dataKey="total" name="Tickets" fill="#6366f1" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title={filter === "today" ? "Volume do dia" : filter === "7d" ? "Volume — 7 dias" : "Volume — 30 dias"}>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={volumeData}>
                <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                <YAxis tick={{ fill: "#a1a1aa", fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#111", border: "1px solid #262626", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#a1a1aa" }} />
                <Line type="monotone" dataKey="total" name="Tickets" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Por status">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                  label={({ name, percent }) =>
                    percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""
                  }
                  labelLine={false}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={entry.name} fill={statusColors[index % statusColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#111", border: "1px solid #262626", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#a1a1aa" }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-[#1a1a1a] bg-[#111111] p-4">
      <p className="section-label mb-3 text-[#71717a]">{title}</p>
      {children}
    </section>
  );
}

function MetricCard({
  label,
  value,
  urgent,
  warning,
}: {
  label: string;
  value: number;
  urgent?: boolean;
  warning?: boolean;
}) {
  return (
    <div className="rounded-md border border-[#1a1a1a] bg-[#111111] px-4 py-3">
      <div
        className={`text-2xl font-mono font-bold tabular-nums ${
          urgent ? "text-[#ef4444]" : warning ? "text-[#f59e0b]" : "text-[#ededed]"
        }`}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[10px] text-[#a1a1aa]">{label}</div>
    </div>
  );
}

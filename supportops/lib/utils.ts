import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Ticket, TicketCategory, TicketPriority, TicketSource } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function priorityLabel(p: TicketPriority) {
  const map: Record<TicketPriority, string> = {
    urgent: "Urgente",
    high: "Alta",
    normal: "Normal",
    low: "Baixa",
  };
  return map[p];
}

export function categoryLabel(c: TicketCategory) {
  const map: Record<TicketCategory, string> = {
    licenca: "Licença",
    bug: "Bug",
    faq: "FAQ",
    suporte: "Suporte",
    sugestao: "Sugestão",
  };
  return map[c];
}

export function sourceLabel(s: TicketSource) {
  const map: Record<TicketSource, string> = {
    academy: "Academy",
    zendesk: "Zendesk",
    chatguru: "ChatGuru",
    manual: "Manual",
  };
  return map[s];
}

export function formatScanTime(iso: string | null) {
  if (!iso) return "Nunca";
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export const indicatorColorMap = {
  gray: "#a1a1aa",
  blue: "#3b82f6",
  yellow: "#f59e0b",
  red: "#ef4444",
  green: "#22c55e",
  purple: "#a855f7",
} as const;

export function renderConfirmationTemplate(template: string | null | undefined, ticket: Ticket) {
  if (!template) return "";
  return template
    .replaceAll("{{ticket_id}}", ticket.external_id ?? ticket.id)
    .replaceAll("{{cliente}}", ticket.person ?? "")
    .replaceAll("{{titulo}}", ticket.title)
    .replaceAll("{{prioridade}}", priorityLabel(ticket.priority));
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { TicketCategory, TicketPriority, TicketSource } from "@/types";

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
  return s === "academy" ? "Academy" : "Zendesk";
}

export function formatScanTime(iso: string | null) {
  if (!iso) return "Nunca";
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

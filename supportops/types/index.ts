// ─── Enums / Literals ────────────────────────────────────────────────────────

export type TicketSource = "academy" | "zendesk";

export type TicketStatus = "open" | "pending" | "solved" | "closed";

export type TicketPriority = "urgent" | "high" | "normal" | "low";

export type TicketCategory =
  | "licenca"
  | "bug"
  | "faq"
  | "suporte"
  | "sugestao";

export type KanbanColumnId =
  | "triagem"
  | "licenca"
  | "bug_suporte"
  | "faq"
  | "resolvido";

// ─── Ticket ──────────────────────────────────────────────────────────────────

export interface Ticket {
  id: string;
  source: TicketSource;
  title: string;
  person: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  time_open: string;
  suggested_response: string;
  tags: string[];
  assignee?: string;
  column: KanbanColumnId;
  created_at?: string;
}

// ─── Briefing ─────────────────────────────────────────────────────────────────

export interface BriefingSummary {
  total: number;
  urgent: number;
  academy: number;
  zendesk: number;
  pending_licenses: number;
}

export interface Briefing {
  generated_at: string;
  summary: BriefingSummary;
  priorities: string[];
  claude_analysis: string;
  tickets: Ticket[];
}

// ─── Kanban ───────────────────────────────────────────────────────────────────

export interface KanbanColumn {
  id: KanbanColumnId;
  label: string;
  description: string;
  accent: string;
  ticketIds: string[];
}

// ─── Store ────────────────────────────────────────────────────────────────────

export interface SupportOpsStore {
  briefing: Briefing | null;
  columns: KanbanColumn[];
  tickets: Record<string, Ticket>;
  isLoading: boolean;
  lastScan: string | null;

  // Pending modal state
  pendingMove: {
    ticketId: string;
    targetColumn: KanbanColumnId;
  } | null;

  // Actions
  loadBriefing: (briefing: Briefing) => void;
  moveTicket: (ticketId: string, targetColumn: KanbanColumnId) => void;
  confirmMove: () => void;
  cancelMove: () => void;
  assignTicket: (ticketId: string, assignee: string) => void;
  triggerScan: () => void;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export type ModalType = "license" | "resolve" | "assign" | null;

// ─── Enums / Literals ────────────────────────────────────────────────────────

export type TicketSource = "academy" | "zendesk" | "chatguru" | "manual";

export type TicketStatus = "open" | "in_progress" | "pending" | "resolved";

export type TicketPriority = "urgent" | "high" | "normal";

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
  external_id?: string | null;
  column_id?: string | null;
  source: TicketSource;
  title: string;
  description?: string | null;
  person?: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  time_open?: string | null;
  suggested_response?: string | null;
  tags: string[];
  assignee?: string | null;
  position?: number;
  department?: string;
  created_at?: string | null;
  updated_at?: string | null;
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
  id?: string;
  generated_at: string;
  summary: BriefingSummary;
  priorities: string[];
  claude_analysis?: string | null;
  raw_data?: Record<string, unknown> | null;
  department?: string;
}

// ─── Kanban ───────────────────────────────────────────────────────────────────

export interface KanbanColumn {
  id: string;
  title: string;
  description?: string | null;
  webhook_url?: string | null;
  confirmation_enabled: boolean;
  confirmation_title?: string | null;
  confirmation_message?: string | null;
  indicator_color: "gray" | "blue" | "yellow" | "red" | "green" | "purple";
  position: number;
  department?: string;
  ticketIds: string[];
}

export interface CreateColumnInput {
  title: string;
  description?: string;
  webhook_url?: string;
  confirmation_enabled?: boolean;
  confirmation_title?: string;
  confirmation_message?: string;
  indicator_color?: KanbanColumn["indicator_color"];
  position?: number;
  department?: string;
}

export interface UpdateColumnInput extends Partial<CreateColumnInput> {}

export interface CreateTicketInput {
  external_id?: string;
  column_id?: string | null;
  title: string;
  description?: string;
  person?: string;
  source: TicketSource;
  priority?: TicketPriority;
  category?: TicketCategory;
  status?: TicketStatus;
  time_open?: string;
  suggested_response?: string;
  tags?: string[];
  assignee?: string;
  position?: number;
  department?: string;
}

export interface UpdateTicketInput extends Partial<CreateTicketInput> {}

export interface BriefingInput {
  generated_at?: string;
  summary: BriefingSummary;
  priorities?: string[];
  claude_analysis?: string;
  raw_data?: Record<string, unknown>;
  department?: string;
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

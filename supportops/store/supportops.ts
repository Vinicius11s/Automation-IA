"use client";

import { create } from "zustand";
import type {
  Briefing,
  CreateColumnInput,
  CreateTicketInput,
  KanbanColumn,
  Ticket,
  UpdateColumnInput,
  UpdateTicketInput,
} from "@/types";

const DEPARTMENT = "suporte";

function normalizeColumns(columns: any[], tickets: Ticket[]): KanbanColumn[] {
  return columns
    .sort((a, b) => a.position - b.position)
    .map((column) => ({
      ...column,
      ticketIds: tickets
        .filter((ticket) => ticket.column_id === column.id)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .map((ticket) => ticket.id),
    }));
}

function toMap(tickets: Ticket[]) {
  return Object.fromEntries(tickets.map((ticket) => [ticket.id, ticket]));
}

interface StoreState {
  briefing: Briefing | null;
  columns: KanbanColumn[];
  tickets: Record<string, Ticket>;
  columnsLoading: boolean;
  ticketsLoading: boolean;
  pendingMove: { ticketId: string; targetColumnId: string; position: number } | null;

  fetchColumns: () => Promise<void>;
  fetchTickets: () => Promise<void>;
  fetchBriefing: () => Promise<void>;
  createColumn: (data: CreateColumnInput) => Promise<void>;
  updateColumn: (id: string, data: UpdateColumnInput) => Promise<void>;
  deleteColumn: (id: string) => Promise<void>;
  createTicket: (data: CreateTicketInput) => Promise<void>;
  updateTicket: (id: string, data: UpdateTicketInput) => Promise<void>;
  deleteTicket: (id: string) => Promise<void>;
  moveTicketOptimistic: (ticketId: string, targetColumnId: string, position: number) => Promise<{ webhookFired: boolean; webhookSuccess: boolean }>;
  askConfirmationMove: (ticketId: string, targetColumnId: string, position: number) => void;
  clearPendingMove: () => void;
}

export const useSupportOpsStore = create<StoreState>((set, get) => ({
  briefing: null,
  columns: [],
  tickets: {},
  columnsLoading: false,
  ticketsLoading: false,
  pendingMove: null,

  fetchColumns: async () => {
    set({ columnsLoading: true });
    try {
      const response = await fetch(`/api/columns?department=${DEPARTMENT}`);
      const columns = await response.json();
      set((state) => ({
        columns: normalizeColumns(columns, Object.values(state.tickets)),
        columnsLoading: false,
      }));
    } catch {
      set({ columnsLoading: false });
    }
  },

  fetchTickets: async () => {
    set({ ticketsLoading: true });
    try {
      const response = await fetch(`/api/tickets?department=${DEPARTMENT}`);
      const tickets = (await response.json()) as Ticket[];
      set((state) => ({
        tickets: toMap(tickets),
        columns: normalizeColumns(state.columns, tickets),
        ticketsLoading: false,
      }));
    } catch {
      set({ ticketsLoading: false });
    }
  },

  fetchBriefing: async () => {
    try {
      const response = await fetch(`/api/briefing?department=${DEPARTMENT}`);
      const briefing = await response.json();
      set({ briefing });
    } catch {
      set({ briefing: null });
    }
  },

  createColumn: async (data) => {
    await fetch("/api/columns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await get().fetchColumns();
  },

  updateColumn: async (id, data) => {
    await fetch(`/api/columns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await get().fetchColumns();
  },

  deleteColumn: async (id) => {
    await fetch(`/api/columns/${id}`, { method: "DELETE" });
    await Promise.all([get().fetchColumns(), get().fetchTickets()]);
  },

  createTicket: async (data) => {
    await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await get().fetchTickets();
  },

  updateTicket: async (id, data) => {
    await fetch(`/api/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await get().fetchTickets();
  },

  deleteTicket: async (id) => {
    // Optimistic: remove from UI immediately
    set((state) => {
      const { [id]: _removed, ...rest } = state.tickets;
      return {
        tickets: rest,
        columns: state.columns.map((col) => ({
          ...col,
          ticketIds: col.ticketIds.filter((tid) => tid !== id),
        })),
      };
    });
    try {
      await fetch(`/api/tickets/${id}`, { method: "DELETE" });
    } catch {
      // Restore on failure
      await get().fetchTickets();
    }
  },

  moveTicketOptimistic: async (ticketId, targetColumnId, position) => {
    const previous = get();
    const previousTicket = previous.tickets[ticketId];
    if (!previousTicket) return { webhookFired: false, webhookSuccess: false };

    const targetColumn = get().columns.find((c) => c.id === targetColumnId);
    const isResolved = targetColumn?.title?.toLowerCase() === "resolvido";

    set((state) => {
      const nextTickets = {
        ...state.tickets,
        [ticketId]: {
          ...state.tickets[ticketId],
          column_id: targetColumnId,
          position,
          ...(isResolved ? { status: "resolved" as const } : {}),
        },
      };
      const nextColumns = state.columns.map((column) => {
        const ticketIds = column.ticketIds.filter((id) => id !== ticketId);
        if (column.id === targetColumnId) {
          ticketIds.splice(position, 0, ticketId);
        }
        return { ...column, ticketIds };
      });
      return {
        tickets: nextTickets,
        columns: nextColumns,
      };
    });

    try {
      const response = await fetch(`/api/tickets/${ticketId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnId: targetColumnId, position }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error("Falha ao mover ticket");

      return {
        webhookFired: Boolean(payload.webhookFired),
        webhookSuccess: Boolean(payload.webhookSuccess),
      };
    } catch {
      set({
        tickets: previous.tickets,
        columns: previous.columns,
      });
      throw new Error("Falha ao mover ticket");
    }
  },

  askConfirmationMove: (ticketId, targetColumnId, position) => {
    set({ pendingMove: { ticketId, targetColumnId, position } });
  },

  clearPendingMove: () => set({ pendingMove: null }),
}));

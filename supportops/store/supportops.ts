"use client";

import { create } from "zustand";
import type {
  Briefing,
  KanbanColumn,
  KanbanColumnId,
  Ticket,
} from "@/types";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_TICKETS: Ticket[] = [
  {
    id: "AC-001",
    source: "academy",
    title: "Não consigo acessar o módulo 3 do curso",
    person: "Fernanda Lima",
    status: "open",
    priority: "urgent",
    category: "licenca",
    time_open: "3h",
    suggested_response:
      "Olá Fernanda! Verifiquei sua conta e identifiquei que a licença do módulo 3 não foi ativada. Vou liberar agora mesmo. Em instantes você já terá acesso. Qualquer dúvida, estou à disposição!",
    tags: ["acesso", "módulo", "licença"],
    column: "triagem",
    created_at: "2026-03-23T06:12:00",
  },
  {
    id: "AC-002",
    source: "academy",
    title: "Vídeo travando no meio da aula — erro de streaming",
    person: "Carlos Mendes",
    status: "open",
    priority: "high",
    category: "bug",
    time_open: "1h 20m",
    suggested_response:
      "Olá Carlos! Identificamos uma instabilidade no servidor de streaming que afetou alguns usuários hoje cedo. Já foi corrigida. Tente limpar o cache do navegador e recarregar a página. Se o problema persistir, me avise!",
    tags: ["bug", "streaming", "vídeo"],
    column: "triagem",
    created_at: "2026-03-23T07:45:00",
  },
  {
    id: "AC-003",
    source: "academy",
    title: "Como emito o certificado de conclusão?",
    person: "Ana Paula Souza",
    status: "open",
    priority: "normal",
    category: "faq",
    time_open: "45m",
    suggested_response:
      "Olá Ana Paula! Para emitir seu certificado: acesse a área 'Meus Cursos' → clique no curso concluído → botão 'Certificado'. O download é em PDF. Lembre que é necessário ter completado 100% das aulas!",
    tags: ["certificado", "conclusão", "faq"],
    column: "faq",
    created_at: "2026-03-23T08:20:00",
  },
  {
    id: "AC-004",
    source: "academy",
    title: "Preciso de acesso para mais 3 colaboradores da empresa",
    person: "Roberto Alves",
    status: "open",
    priority: "high",
    category: "licenca",
    time_open: "2h",
    suggested_response:
      "Olá Roberto! Para adicionar mais colaboradores ao seu plano corporativo, precisarei verificar seu contrato atual. Vou checar a disponibilidade de licenças extras. Poderia confirmar os e-mails dos 3 colaboradores?",
    tags: ["corporativo", "licença", "colaboradores"],
    column: "licenca",
    created_at: "2026-03-23T07:00:00",
  },
  {
    id: "ZD-001",
    source: "zendesk",
    title: "Sistema não importa planilha Excel — erro 422",
    person: "Juliana Costa",
    status: "open",
    priority: "urgent",
    category: "bug",
    time_open: "4h 30m",
    suggested_response:
      "Olá Juliana! O erro 422 indica um problema de validação no formato da planilha. Identifiquei que versões Excel anteriores ao 2016 causam esse comportamento. Salve o arquivo como .xlsx (não .xls) e tente novamente. Caso persista, envie o arquivo que verificamos aqui.",
    tags: ["bug", "excel", "importação", "erro-422"],
    column: "bug_suporte",
    created_at: "2026-03-23T04:30:00",
  },
  {
    id: "ZD-002",
    source: "zendesk",
    title: "Solicito liberação de licença adicional — contrato #8821",
    person: "Marcelo Ferreira",
    status: "pending",
    priority: "high",
    category: "licenca",
    time_open: "1h",
    suggested_response:
      "Olá Marcelo! Localizei o contrato #8821. Vou processar a liberação da licença adicional conforme solicitado. Você receberá o e-mail de confirmação em até 30 minutos. Confirme se o e-mail do novo usuário é o mesmo do cadastro.",
    tags: ["licença", "contrato", "corporativo"],
    column: "triagem",
    created_at: "2026-03-23T08:05:00",
  },
  {
    id: "ZD-003",
    source: "zendesk",
    title: "Como integrar API com sistema ERP legado?",
    person: "Patricia Nunes",
    status: "open",
    priority: "normal",
    category: "suporte",
    time_open: "5h",
    suggested_response:
      "Olá Patricia! Temos documentação específica para integração com ERPs legados. Vou enviar o guia de webhooks e exemplos de autenticação via API key. Para ERPs com versões antigas, recomendamos o conector REST. Posso agendar uma call técnica se preferir?",
    tags: ["api", "erp", "integração", "técnico"],
    column: "bug_suporte",
    created_at: "2026-03-23T03:00:00",
  },
  {
    id: "ZD-004",
    source: "zendesk",
    title: "Sugestão: adicionar filtro por data no relatório",
    person: "Eduardo Ramos",
    status: "open",
    priority: "low",
    category: "sugestao",
    time_open: "2d",
    suggested_response:
      "Olá Eduardo! Obrigado pela sugestão! Já está no nosso roadmap para Q2/2026 — filtros avançados nos relatórios incluindo período personalizado. Vou registrar seu voto de prioridade. Você quer ser notificado quando for lançado?",
    tags: ["sugestão", "relatório", "filtro", "roadmap"],
    column: "faq",
    created_at: "2026-03-21T14:00:00",
  },
  {
    id: "AC-005",
    source: "academy",
    title: "Quero cancelar minha assinatura",
    person: "Rodrigo Santos",
    status: "open",
    priority: "urgent",
    category: "suporte",
    time_open: "30m",
    suggested_response:
      "Olá Rodrigo! Sinto muito ouvir isso. Antes de prosseguir com o cancelamento, posso entender o que motivou essa decisão? Temos opções como pausar a assinatura por até 3 meses ou migrar para um plano mais adequado. Posso te ajudar a encontrar a melhor solução.",
    tags: ["cancelamento", "assinatura", "retenção"],
    column: "triagem",
    created_at: "2026-03-23T08:35:00",
  },
  {
    id: "ZD-005",
    source: "zendesk",
    title: "Senha resetada mas acesso ainda bloqueado",
    person: "Camila Rocha",
    status: "open",
    priority: "high",
    category: "bug",
    time_open: "2h 15m",
    suggested_response:
      "Olá Camila! Há um cache de sessão que pode demorar até 15 minutos para expirar após o reset de senha. Tente acessar em aba anônima ou limpe os cookies. Se ainda estiver bloqueada, vou forçar a expiração da sessão manualmente pelo painel admin.",
    tags: ["bug", "senha", "acesso", "login"],
    column: "resolvido",
    created_at: "2026-03-23T06:50:00",
  },
];

const INITIAL_COLUMNS: KanbanColumn[] = [
  {
    id: "triagem",
    label: "Triagem",
    description: "Tickets recém-chegados",
    accent: "oklch(0.72 0.18 195)",
    ticketIds: [],
  },
  {
    id: "licenca",
    label: "Liberar Licença",
    description: "Aguardando liberação de acesso",
    accent: "oklch(0.7 0.17 280)",
    ticketIds: [],
  },
  {
    id: "bug_suporte",
    label: "Bug / Suporte",
    description: "Erros técnicos e análise",
    accent: "oklch(0.65 0.22 25)",
    ticketIds: [],
  },
  {
    id: "faq",
    label: "FAQ",
    description: "Dúvidas com resposta padrão",
    accent: "oklch(0.72 0.15 145)",
    ticketIds: [],
  },
  {
    id: "resolvido",
    label: "Resolvido",
    description: "Tickets finalizados hoje",
    accent: "oklch(0.6 0.01 220)",
    ticketIds: [],
  },
];

function buildColumns(tickets: Ticket[]): KanbanColumn[] {
  return INITIAL_COLUMNS.map((col) => ({
    ...col,
    ticketIds: tickets.filter((t) => t.column === col.id).map((t) => t.id),
  }));
}

const MOCK_BRIEFING: Briefing = {
  generated_at: "2026-03-23T09:00:00",
  summary: {
    total: MOCK_TICKETS.length,
    urgent: MOCK_TICKETS.filter((t) => t.priority === "urgent").length,
    academy: MOCK_TICKETS.filter((t) => t.source === "academy").length,
    zendesk: MOCK_TICKETS.filter((t) => t.source === "zendesk").length,
    pending_licenses: MOCK_TICKETS.filter((t) => t.category === "licenca")
      .length,
  },
  priorities: [
    "ZD-001: Erro 422 na importação de planilha (4h aberto, urgente)",
    "AC-001: Fernanda sem acesso ao módulo 3 desde 06h",
    "AC-005: Possível cancelamento — contato imediato necessário",
  ],
  claude_analysis:
    "Dia com demanda acima do normal — 3 tickets urgentes identificados. O pico de tickets de bug está relacionado a uma instabilidade de streaming resolvida às 07h30. Dois tickets de licença corporativa requerem validação de contrato antes da liberação. O ticket ZD-001 está há mais tempo sem resposta e deve ser priorizado. Atenção especial ao ticket AC-005 (risco de churn).",
  tickets: MOCK_TICKETS,
};

// ─── Store ────────────────────────────────────────────────────────────────────

interface StoreState {
  briefing: Briefing;
  columns: KanbanColumn[];
  tickets: Record<string, Ticket>;
  isLoading: boolean;
  lastScan: string | null;
  pendingMove: { ticketId: string; targetColumn: KanbanColumnId } | null;

  loadBriefing: (briefing: Briefing) => void;
  moveTicket: (
    ticketId: string,
    fromColumn: KanbanColumnId,
    toColumn: KanbanColumnId,
    toIndex?: number
  ) => void;
  reorderInColumn: (
    columnId: KanbanColumnId,
    startIndex: number,
    endIndex: number
  ) => void;
  confirmMove: () => void;
  cancelMove: () => void;
  assignTicket: (ticketId: string, assignee: string) => void;
  triggerScan: () => void;
}

export const useSupportOpsStore = create<StoreState>((set, get) => ({
  briefing: MOCK_BRIEFING,
  columns: buildColumns(MOCK_TICKETS),
  tickets: Object.fromEntries(MOCK_TICKETS.map((t) => [t.id, t])),
  isLoading: false,
  lastScan: "2026-03-23T09:00:00",
  pendingMove: null,

  loadBriefing: (briefing) => {
    set({
      briefing,
      tickets: Object.fromEntries(briefing.tickets.map((t) => [t.id, t])),
      columns: buildColumns(briefing.tickets),
    });
  },

  moveTicket: (ticketId, fromColumn, toColumn, toIndex) => {
    // Special columns show modal instead of moving directly
    if (toColumn === "licenca" || toColumn === "resolvido") {
      // Revert visual drag (DnD lib already moved it), store pending
      set({ pendingMove: { ticketId, targetColumn: toColumn } });
      return;
    }

    set((state) => {
      const ticket = state.tickets[ticketId];
      if (!ticket) return state;

      const updatedTicket = { ...ticket, column: toColumn };
      const newColumns = state.columns.map((col) => {
        if (col.id === fromColumn) {
          return { ...col, ticketIds: col.ticketIds.filter((id) => id !== ticketId) };
        }
        if (col.id === toColumn) {
          const ids = col.ticketIds.filter((id) => id !== ticketId);
          if (toIndex !== undefined) {
            ids.splice(toIndex, 0, ticketId);
          } else {
            ids.push(ticketId);
          }
          return { ...col, ticketIds: ids };
        }
        return col;
      });

      return {
        tickets: { ...state.tickets, [ticketId]: updatedTicket },
        columns: newColumns,
      };
    });
  },

  reorderInColumn: (columnId, startIndex, endIndex) => {
    set((state) => {
      const col = state.columns.find((c) => c.id === columnId);
      if (!col) return state;
      const ids = [...col.ticketIds];
      const [removed] = ids.splice(startIndex, 1);
      ids.splice(endIndex, 0, removed);
      return {
        columns: state.columns.map((c) =>
          c.id === columnId ? { ...c, ticketIds: ids } : c
        ),
      };
    });
  },

  confirmMove: () => {
    const { pendingMove } = get();
    if (!pendingMove) return;
    const { ticketId, targetColumn } = pendingMove;

    set((state) => {
      const ticket = state.tickets[ticketId];
      if (!ticket) return { pendingMove: null };
      const prevColumn = ticket.column;
      return {
        pendingMove: null,
        tickets: {
          ...state.tickets,
          [ticketId]: { ...ticket, column: targetColumn },
        },
        columns: state.columns.map((col) => {
          if (col.id === prevColumn) {
            return { ...col, ticketIds: col.ticketIds.filter((id) => id !== ticketId) };
          }
          if (col.id === targetColumn) {
            return { ...col, ticketIds: [...col.ticketIds, ticketId] };
          }
          return col;
        }),
      };
    });
  },

  cancelMove: () => set({ pendingMove: null }),

  assignTicket: (ticketId, assignee) => {
    set((state) => ({
      tickets: {
        ...state.tickets,
        [ticketId]: { ...state.tickets[ticketId], assignee },
      },
    }));
  },

  triggerScan: () => {
    set({ isLoading: true });
    setTimeout(() => {
      set({ isLoading: false, lastScan: new Date().toISOString() });
    }, 3000);
  },
}));

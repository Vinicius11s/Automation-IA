"use client";

import { useState } from "react";
import type { CreateTicketInput, Ticket, TicketCategory, TicketPriority, TicketSource } from "@/types";
import { useSupportOpsStore } from "@/store/supportops";

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: Partial<Ticket>;
  columnId?: string;
  title: string;
  onSubmit: (data: CreateTicketInput) => Promise<void>;
}

const SOURCES: TicketSource[] = ["academy", "zendesk", "chatguru", "manual"];
const PRIORITIES: TicketPriority[] = ["urgent", "high", "normal"];
const CATEGORIES: TicketCategory[] = ["licenca", "bug", "faq", "suporte", "sugestao"];

export function TicketSheet({ open, onClose, initial, columnId, title, onSubmit }: Props) {
  const [saving, setSaving] = useState(false);
  const columns = useSupportOpsStore((state) => state.columns);
  const currentColumnId = initial?.column_id ?? columnId;
  const currentColumn = columns.find((col) => col.id === currentColumnId);
  const isInFaqColumn = currentColumn?.title?.toLowerCase() === "faq";
  const [form, setForm] = useState<CreateTicketInput>({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    source: initial?.source ?? "manual",
    priority: initial?.priority ?? "normal",
    category: initial?.category ?? "suporte",
    person: initial?.person ?? "",
    external_id: initial?.external_id ?? "",
    column_id: initial?.column_id ?? columnId ?? null,
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a] shrink-0">
          <h3 className="text-sm font-medium text-[#ededed]">{title}</h3>
          <button
            onClick={onClose}
            className="text-[#525252] hover:text-[#a1a1aa] transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <div className="flex flex-col gap-4 text-xs">

            {/* Campos em grid 2 colunas */}
            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2 flex flex-col gap-1">
                <span className="text-[#a1a1aa]">Título *</span>
                <input
                  className="rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-[#ededed] focus:outline-none focus:border-[#404040]"
                  value={form.title ?? ""}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                />
              </label>
              <label className="col-span-2 flex flex-col gap-1">
                <span className="text-[#a1a1aa]">Descrição</span>
                <textarea
                  rows={3}
                  className="rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-[#ededed] resize-none focus:outline-none focus:border-[#404040]"
                  value={form.description ?? ""}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[#a1a1aa]">Plataforma</span>
                <select
                  className="rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-[#ededed] focus:outline-none focus:border-[#404040]"
                  value={form.source}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, source: event.target.value as TicketSource }))
                  }
                >
                  {SOURCES.map((source) => (
                    <option value={source} key={source}>{source}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[#a1a1aa]">Prioridade</span>
                <select
                  className="rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-[#ededed] focus:outline-none focus:border-[#404040]"
                  value={form.priority}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, priority: event.target.value as TicketPriority }))
                  }
                >
                  {PRIORITIES.map((priority) => (
                    <option value={priority} key={priority}>{priority}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[#a1a1aa]">Categoria</span>
                <select
                  className="rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-[#ededed] focus:outline-none focus:border-[#404040]"
                  value={form.category}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, category: event.target.value as TicketCategory }))
                  }
                >
                  {CATEGORIES.map((category) => (
                    <option value={category} key={category}>{category}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[#a1a1aa]">Nome do cliente</span>
                <input
                  className="rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-[#ededed] focus:outline-none focus:border-[#404040]"
                  value={form.person ?? ""}
                  onChange={(event) => setForm((prev) => ({ ...prev, person: event.target.value }))}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[#a1a1aa]">ID externo</span>
                <input
                  className="rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-[#ededed] font-mono focus:outline-none focus:border-[#404040]"
                  value={form.external_id ?? ""}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, external_id: event.target.value }))
                  }
                />
              </label>
            </div>

            {/* Sugestão Chatbase — no fim do body */}
            {isInFaqColumn && initial?.suggested_response && (
              <div className="flex flex-col gap-2 rounded-lg border border-[#1a2a1a] bg-[#0d1a0d] p-4">
                <div className="flex items-center gap-2">
                  <div className="size-1.5 rounded-full bg-[#4ade80]" />
                  <span className="text-[#4ade80] text-[11px] font-medium tracking-wide uppercase">
                    Sugestão de resposta — Chatbase
                  </span>
                </div>
                <p className="text-[#d4d4d4] leading-relaxed whitespace-pre-wrap">
                  {initial.suggested_response}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#1a1a1a] shrink-0">
          <button
            className="rounded-md border border-[#262626] px-4 py-2 text-xs text-[#a1a1aa] hover:text-[#ededed] transition-colors"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            disabled={!form.title || saving}
            className="rounded-md border border-[#262626] bg-[#1c1c1c] px-4 py-2 text-xs text-[#ededed] hover:bg-[#242424] disabled:opacity-40 transition-colors"
            onClick={async () => {
              setSaving(true);
              await onSubmit(form);
              setSaving(false);
              onClose();
            }}
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

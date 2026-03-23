"use client";

import { useState } from "react";
import type { CreateTicketInput, Ticket, TicketCategory, TicketPriority, TicketSource } from "@/types";

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
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md border-l border-[#1a1a1a] bg-[#0a0a0a] p-5">
        <h3 className="text-sm text-[#ededed]">{title}</h3>
        <div className="mt-4 flex flex-col gap-3 text-xs">
          <label className="flex flex-col gap-1">
            <span className="text-[#a1a1aa]">Título *</span>
            <input
              className="rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-[#ededed]"
              value={form.title ?? ""}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[#a1a1aa]">Descrição</span>
            <textarea
              className="rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-[#ededed]"
              value={form.description ?? ""}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[#a1a1aa]">Plataforma</span>
            <select
              className="rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-[#ededed]"
              value={form.source}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, source: event.target.value as TicketSource }))
              }
            >
              {SOURCES.map((source) => (
                <option value={source} key={source}>
                  {source}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[#a1a1aa]">Prioridade</span>
            <select
              className="rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-[#ededed]"
              value={form.priority}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, priority: event.target.value as TicketPriority }))
              }
            >
              {PRIORITIES.map((priority) => (
                <option value={priority} key={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[#a1a1aa]">Categoria</span>
            <select
              className="rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-[#ededed]"
              value={form.category}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, category: event.target.value as TicketCategory }))
              }
            >
              {CATEGORIES.map((category) => (
                <option value={category} key={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[#a1a1aa]">Nome do cliente</span>
            <input
              className="rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-[#ededed]"
              value={form.person ?? ""}
              onChange={(event) => setForm((prev) => ({ ...prev, person: event.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[#a1a1aa]">ID externo</span>
            <input
              className="rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-[#ededed]"
              value={form.external_id ?? ""}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, external_id: event.target.value }))
              }
            />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            className="rounded-md border border-[#262626] px-3 py-2 text-xs text-[#a1a1aa]"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            disabled={!form.title || saving}
            className="rounded-md border border-[#262626] bg-[#1c1c1c] px-3 py-2 text-xs text-[#ededed] disabled:opacity-40"
            onClick={async () => {
              setSaving(true);
              await onSubmit(form);
              setSaving(false);
              onClose();
            }}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

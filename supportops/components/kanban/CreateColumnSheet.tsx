"use client";

import { useMemo, useState } from "react";
import type { CreateColumnInput, KanbanColumn } from "@/types";
import { indicatorColorMap } from "@/lib/utils";

const COLORS: Array<KanbanColumn["indicator_color"]> = [
  "gray",
  "blue",
  "yellow",
  "red",
  "green",
  "purple",
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateColumnInput) => Promise<void>;
  initial?: Partial<KanbanColumn>;
  title: string;
}

export function CreateColumnSheet({ open, onClose, onSubmit, initial, title }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreateColumnInput>({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    webhook_url: initial?.webhook_url ?? "",
    confirmation_enabled: initial?.confirmation_enabled ?? false,
    confirmation_title: initial?.confirmation_title ?? "",
    confirmation_message: initial?.confirmation_message ?? "",
    indicator_color: initial?.indicator_color ?? "gray",
  });

  const isUrlValid = useMemo(() => {
    if (!form.webhook_url) return true;
    try {
      new URL(form.webhook_url);
      return true;
    } catch {
      return false;
    }
  }, [form.webhook_url]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md border-l border-[#1a1a1a] bg-[#0a0a0a] p-5">
        <h3 className="text-sm text-[#ededed]">{title}</h3>
        <div className="mt-4 flex flex-col gap-3 text-xs">
          <label className="flex flex-col gap-1">
            <span className="text-[#a1a1aa]">Nome *</span>
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
            <span className="text-[#a1a1aa]">Webhook URL</span>
            <input
              className="rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-[#ededed]"
              value={form.webhook_url ?? ""}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, webhook_url: event.target.value }))
              }
            />
            {!isUrlValid && <span className="text-[#ef4444]">URL inválida</span>}
          </label>

          <label className="flex items-center gap-2 text-[#a1a1aa]">
            <input
              type="checkbox"
              checked={Boolean(form.confirmation_enabled)}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, confirmation_enabled: event.target.checked }))
              }
            />
            Ativar confirmação dinâmica
          </label>

          {form.confirmation_enabled && (
            <>
              <label className="flex flex-col gap-1">
                <span className="text-[#a1a1aa]">Título da confirmação</span>
                <input
                  className="rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-[#ededed]"
                  value={form.confirmation_title ?? ""}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, confirmation_title: event.target.value }))
                  }
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[#a1a1aa]">Mensagem (suporta variáveis)</span>
                <textarea
                  className="rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-[#ededed]"
                  value={form.confirmation_message ?? ""}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, confirmation_message: event.target.value }))
                  }
                />
              </label>
            </>
          )}

          <div className="flex flex-col gap-1">
            <span className="text-[#a1a1aa]">Cor do indicador</span>
            <div className="flex gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="size-7 rounded-full border-2"
                  style={{
                    backgroundColor: indicatorColorMap[color],
                    borderColor: form.indicator_color === color ? "#ededed" : "#262626",
                  }}
                  onClick={() => setForm((prev) => ({ ...prev, indicator_color: color }))}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            className="rounded-md border border-[#262626] px-3 py-2 text-xs text-[#a1a1aa]"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            disabled={!form.title || !isUrlValid || saving}
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

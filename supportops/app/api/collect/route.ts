import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { saveBriefing } from "@/lib/db/briefings";
import type { BriefingInput } from "@/types";

interface CollectTicket {
  external_id: string;
  source: string;
  title: string;
  description?: string;
  person?: string;
  status: string;
  priority: string;
  category: string;
  time_open?: string;
  suggested_response?: string;
  tags?: string[];
  platform?: string;
  suggested_column?: string;
  confidence?: number;
}

interface CollectBody {
  department?: string;
  briefing?: BriefingInput;
  tickets: CollectTicket[];
}

export async function POST(request: NextRequest) {
  try {
    const body: CollectBody = await request.json();
    const { tickets, briefing, department = "suporte" } = body;

    if (!tickets?.length) {
      return NextResponse.json({ inserted: 0, updated: 0, skipped: 0 });
    }

    const supabase = createClient();

    // Fetch all columns for this department (used for AI column matching + Triagem fallback)
    const { data: allColumns } = await supabase
      .from("columns")
      .select("id, title")
      .eq("department", department);

    const columnsByTitle = new Map(
      (allColumns ?? []).map((c) => [c.title.toLowerCase(), c.id])
    );
    const defaultColumnId = columnsByTitle.get("triagem") ?? null;

    const externalIds = tickets.map((t) => t.external_id).filter(Boolean);

    const { data: existing } = await supabase
      .from("tickets")
      .select("id, external_id, status")
      .in("external_id", externalIds);

    const existingMap = new Map(
      (existing ?? []).map((t) => [t.external_id as string, t])
    );

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let reopened = 0;

    for (const ticket of tickets) {
      if (!ticket.external_id) continue;

      const found = existingMap.get(ticket.external_id);

      if (found) {
        const incomingIsOpen = ticket.status === "open" || ticket.status === "pending";
        const wasResolved = found.status === "resolved";

        if (wasResolved && !incomingIsOpen) {
          // Still resolved on Academy side too — keep ignoring
          skipped++;
          continue;
        }

        if (wasResolved && incomingIsOpen) {
          // Aluno enviou nova mensagem — reabrir ticket e mover para Triagem
          const { error } = await supabase
            .from("tickets")
            .update({
              status: "open",
              column_id: defaultColumnId,
              description: ticket.description ?? null,
              time_open: ticket.time_open ?? null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", found.id);

          if (!error) reopened++;
          else console.error("[api/collect] reopen error", error);
          continue;
        }

        // Normal update — ticket exists and is not resolved
        const { error } = await supabase
          .from("tickets")
          .update({
            title: ticket.title,
            description: ticket.description ?? null,
            person: ticket.person ?? null,
            status: ticket.status,
            priority: ticket.priority,
            category: ticket.category,
            time_open: ticket.time_open ?? null,
            tags: ticket.tags ?? [],
            source: ticket.source,
            updated_at: new Date().toISOString(),
            // column_id and assignee are intentionally NOT updated here
          })
          .eq("id", found.id);

        if (!error) updated++;
        else console.error("[api/collect] update error", error);
      } else {
        // Use AI-suggested column if confidence >= 0.8, otherwise Triagem
        const aiColumnId =
          ticket.suggested_column && (ticket.confidence ?? 0) >= 0.8
            ? (columnsByTitle.get(ticket.suggested_column.toLowerCase()) ?? defaultColumnId)
            : defaultColumnId;

        const { error } = await supabase.from("tickets").insert({
          external_id: ticket.external_id,
          source: ticket.source,
          title: ticket.title,
          description: ticket.description ?? null,
          person: ticket.person ?? null,
          status: ticket.status,
          priority: ticket.priority,
          category: ticket.category,
          time_open: ticket.time_open ?? null,
          tags: ticket.tags ?? [],
          column_id: aiColumnId,
          department,
        });

        if (!error) inserted++;
        else console.error("[api/collect] insert error", error);
      }
    }

    if (briefing) {
      await saveBriefing({ ...briefing, department });
    }

    return NextResponse.json({ inserted, updated, skipped, reopened });
  } catch (error) {
    console.error("[api/collect][POST]", error);
    return NextResponse.json(
      { error: "Falha ao coletar tickets" },
      { status: 500 }
    );
  }
}

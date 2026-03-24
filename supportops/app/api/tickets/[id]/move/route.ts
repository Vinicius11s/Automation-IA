import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { moveTicket } from "@/lib/db/tickets";
import { getChatbaseSuggestion } from "@/lib/chatbase";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { columnId, position } = body as { columnId: string; position: number };

    const moved = await moveTicket(params.id, columnId, position ?? 0);

    const supabase = createClient();
    const { data: column } = await supabase
      .from("columns")
      .select("title")
      .eq("id", columnId)
      .maybeSingle();

    const columnTitle = column?.title?.toLowerCase() ?? "";

    // Mark as resolved when dropped into a "Resolvido" column
    if (columnTitle === "resolvido") {
      await supabase
        .from("tickets")
        .update({ status: "resolved" })
        .eq("id", params.id);
    }

    // Generate Chatbase suggestion when dropped into FAQ column
    if (columnTitle === "faq") {
      const suggestion = await getChatbaseSuggestion(moved.title, moved.description);
      if (suggestion) {
        await supabase
          .from("tickets")
          .update({ suggested_response: suggestion })
          .eq("id", params.id);
        return NextResponse.json({ success: true, ticket: { ...moved, suggested_response: suggestion } });
      }
    }

    return NextResponse.json({ success: true, ticket: moved });
  } catch {
    return NextResponse.json({ error: "Falha ao mover ticket" }, { status: 500 });
  }
}

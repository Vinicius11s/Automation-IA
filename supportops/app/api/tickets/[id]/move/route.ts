import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { moveTicket } from "@/lib/db/tickets";

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

    // Mark as resolved when dropped into a "Resolvido" column
    if (column?.title?.toLowerCase() === "resolvido") {
      await supabase
        .from("tickets")
        .update({ status: "resolved" })
        .eq("id", params.id);
    }

    return NextResponse.json({ success: true, ticket: moved });
  } catch {
    return NextResponse.json({ error: "Falha ao mover ticket" }, { status: 500 });
  }
}

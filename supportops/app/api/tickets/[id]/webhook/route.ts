import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fireWebhook } from "@/lib/db/webhooks";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();

    const { data: ticket, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();

    if (error || !ticket) {
      return NextResponse.json({ error: "Ticket não encontrado" }, { status: 404 });
    }

    if (!ticket.column_id) {
      return NextResponse.json({ error: "Ticket sem coluna — configure uma coluna primeiro" }, { status: 400 });
    }

    const { data: column } = await supabase
      .from("columns")
      .select("webhook_url")
      .eq("id", ticket.column_id)
      .maybeSingle();

    if (!column?.webhook_url) {
      return NextResponse.json({ error: "Coluna sem webhook configurado" }, { status: 400 });
    }

    const success = await fireWebhook(ticket.column_id, ticket);
    return NextResponse.json({ success });
  } catch (error) {
    console.error("[api/tickets/webhook][POST]", error);
    return NextResponse.json({ error: "Falha ao acionar automação" }, { status: 500 });
  }
}

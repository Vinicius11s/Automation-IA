import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fireWebhook } from "@/lib/db/webhooks";

const SYSTEM_NAME = "RaioX Preditivo Tecnologia";

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
      return NextResponse.json(
        { error: `${SYSTEM_NAME}: ticket não encontrado.` },
        { status: 404 }
      );
    }

    if (!ticket.column_id) {
      return NextResponse.json(
        {
          error: `${SYSTEM_NAME}: este ticket ainda não está em uma coluna. Configure as colunas primeiro.`,
        },
        { status: 400 }
      );
    }

    const { data: column } = await supabase
      .from("columns")
      .select("title,webhook_url")
      .eq("id", ticket.column_id)
      .maybeSingle();

    if (!column?.webhook_url) {
      return NextResponse.json(
        {
          error: `${SYSTEM_NAME}: webhook não configurado para a coluna “${column?.title ?? "esta coluna"}”. Abra a tela de Colunas e informe a Webhook URL.`,
        },
        { status: 400 }
      );
    }

    const success = await fireWebhook(ticket.column_id, ticket);
    return NextResponse.json({ success });
  } catch (error) {
    console.error("[api/tickets/webhook][POST]", error);
    return NextResponse.json(
      { error: `${SYSTEM_NAME}: falha ao acionar a automação agora. Tente novamente em instantes.` },
      { status: 500 }
    );
  }
}

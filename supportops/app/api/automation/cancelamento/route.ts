import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const webhookUrl = process.env.WEBHOOK_CANCELAMENTO_CONSULTA;
    if (!webhookUrl) {
      return NextResponse.json({ error: "Webhook não configurado no servidor" }, { status: 500 });
    }

    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 });
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    let data: unknown;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[api/automation/cancelamento][POST]", error);
    return NextResponse.json({ error: "Falha ao consultar automação" }, { status: 500 });
  }
}

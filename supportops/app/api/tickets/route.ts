import { NextRequest, NextResponse } from "next/server";
import { createTicket, getTicketsByDepartment } from "@/lib/db/tickets";

export async function GET(request: NextRequest) {
  try {
    const department = request.nextUrl.searchParams.get("department") ?? "suporte";
    const data = await getTicketsByDepartment(department);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[api/tickets][GET]", error);
    return NextResponse.json({ error: "Falha ao listar tickets" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const created = await createTicket(body);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("[api/tickets][POST]", error);
    return NextResponse.json({ error: "Falha ao criar ticket" }, { status: 500 });
  }
}

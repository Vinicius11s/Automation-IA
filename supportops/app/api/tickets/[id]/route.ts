import { NextRequest, NextResponse } from "next/server";
import { deleteTicket, updateTicket } from "@/lib/db/tickets";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updated = await updateTicket(params.id, body);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Falha ao atualizar ticket" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteTicket(params.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Falha ao excluir ticket" }, { status: 500 });
  }
}

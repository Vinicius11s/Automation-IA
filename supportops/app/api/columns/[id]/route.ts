import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteColumn, updateColumn } from "@/lib/db/columns";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updated = await updateColumn(params.id, body);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Falha ao atualizar coluna" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: triagem } = await supabase
      .from("columns")
      .select("id")
      .eq("position", 0)
      .eq("department", "suporte")
      .single();

    if (triagem) {
      await supabase
        .from("tickets")
        .update({ column_id: triagem.id })
        .eq("column_id", params.id);
    }

    await deleteColumn(params.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Falha ao excluir coluna" }, { status: 500 });
  }
}

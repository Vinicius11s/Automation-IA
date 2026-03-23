import { NextRequest, NextResponse } from "next/server";
import { createColumn, getColumns } from "@/lib/db/columns";

export async function GET(request: NextRequest) {
  try {
    const department = request.nextUrl.searchParams.get("department") ?? "suporte";
    const data = await getColumns(department);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[api/columns][GET]", error);
    return NextResponse.json({ error: "Falha ao listar colunas" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const created = await createColumn(body);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("[api/columns][POST]", error);
    return NextResponse.json({ error: "Falha ao criar coluna" }, { status: 500 });
  }
}

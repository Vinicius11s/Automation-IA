import { NextRequest, NextResponse } from "next/server";
import { getLatestBriefing, saveBriefing } from "@/lib/db/briefings";

export async function GET(request: NextRequest) {
  try {
    const department = request.nextUrl.searchParams.get("department") ?? "suporte";
    const data = await getLatestBriefing(department);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[api/briefing][GET]", error);
    return NextResponse.json({ error: "Falha ao carregar briefing" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const saved = await saveBriefing(body);
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error("[api/briefing][POST]", error);
    return NextResponse.json({ error: "Falha ao salvar briefing" }, { status: 500 });
  }
}

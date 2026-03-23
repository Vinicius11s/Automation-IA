import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const BRIEFING_PATH = path.join(process.cwd(), "supportops-data", "briefing.json");

export async function POST() {
  return NextResponse.json({ ok: true, message: "Briefing reload triggered" });
}

export async function GET() {
  try {
    if (!fs.existsSync(BRIEFING_PATH)) {
      return NextResponse.json(
        { error: "briefing.json not found — run /morning first" },
        { status: 404 }
      );
    }
    const raw = fs.readFileSync(BRIEFING_PATH, "utf-8");
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: "Failed to read briefing" }, { status: 500 });
  }
}

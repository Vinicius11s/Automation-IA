import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ profile: null }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, department, active")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.active) {
    return NextResponse.json({ profile: null }, { status: 403 });
  }

  return NextResponse.json({ profile });
}

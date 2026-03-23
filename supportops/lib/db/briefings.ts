import { createClient } from "@/lib/supabase/server";
import type { BriefingInput } from "@/types";

export async function getLatestBriefing(department: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("briefings")
    .select("*")
    .eq("department", department)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function saveBriefing(data: BriefingInput) {
  const supabase = createClient();
  const payload = {
    generated_at: data.generated_at ?? new Date().toISOString(),
    summary: data.summary,
    priorities: data.priorities ?? [],
    claude_analysis: data.claude_analysis ?? null,
    raw_data: data.raw_data ?? null,
    department: data.department ?? "suporte",
  };

  const { data: saved, error } = await supabase
    .from("briefings")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return saved;
}

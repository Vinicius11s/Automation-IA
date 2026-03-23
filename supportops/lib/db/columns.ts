import { createClient } from "@/lib/supabase/server";
import type { CreateColumnInput, UpdateColumnInput } from "@/types";

export async function getColumns(department: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("columns")
    .select("*")
    .eq("department", department)
    .order("position", { ascending: true });

  if (error) throw error;
  return data;
}

export async function createColumn(data: CreateColumnInput) {
  const supabase = createClient();
  const payload = {
    ...data,
    department: data.department ?? "suporte",
  };

  const { data: created, error } = await supabase
    .from("columns")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return created;
}

export async function updateColumn(id: string, data: UpdateColumnInput) {
  const supabase = createClient();
  const { data: updated, error } = await supabase
    .from("columns")
    .update(data)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return updated;
}

export async function deleteColumn(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("columns").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderColumns(ids: string[]) {
  const supabase = createClient();

  await Promise.all(
    ids.map(async (id, position) => {
      const { error } = await supabase
        .from("columns")
        .update({ position })
        .eq("id", id);

      if (error) throw error;
    })
  );
}

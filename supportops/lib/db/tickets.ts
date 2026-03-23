import { createClient } from "@/lib/supabase/server";
import type { CreateTicketInput, UpdateTicketInput } from "@/types";

export async function getTicketsByDepartment(department: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("department", department)
    .order("position", { ascending: true });

  if (error) throw error;
  return data;
}

export async function createTicket(data: CreateTicketInput) {
  const supabase = createClient();
  const payload = {
    ...data,
    department: data.department ?? "suporte",
    tags: data.tags ?? [],
  };

  const { data: created, error } = await supabase
    .from("tickets")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return created;
}

export async function updateTicket(id: string, data: UpdateTicketInput) {
  const supabase = createClient();
  const { data: updated, error } = await supabase
    .from("tickets")
    .update(data)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return updated;
}

export async function deleteTicket(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("tickets").delete().eq("id", id);
  if (error) throw error;
}

export async function moveTicket(id: string, columnId: string, position: number) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tickets")
    .update({ column_id: columnId, position })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

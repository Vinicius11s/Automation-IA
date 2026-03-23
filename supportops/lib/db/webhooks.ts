import { createClient } from "@/lib/supabase/server";
import type { Ticket } from "@/types";

export async function fireWebhook(columnId: string, ticket: Ticket): Promise<boolean> {
  const supabase = createClient();

  const { data: column, error: columnError } = await supabase
    .from("columns")
    .select("id,webhook_url")
    .eq("id", columnId)
    .maybeSingle();

  if (columnError || !column?.webhook_url) {
    return false;
  }

  const payload = {
    ticket_id: ticket.external_id ?? ticket.id,
    cliente: ticket.person ?? "",
    titulo: ticket.title,
    prioridade: ticket.priority,
    category: ticket.category,
    source: ticket.source,
  };

  let success = false;
  let statusCode: number | null = null;
  let errorMessage: string | null = null;

  try {
    const response = await fetch(column.webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    success = response.ok;
    statusCode = response.status;

    if (!response.ok) {
      errorMessage = `Webhook failed with status ${response.status}`;
    }
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unknown webhook error";
  }

  await supabase.from("webhook_logs").insert({
    column_id: columnId,
    ticket_id: ticket.id,
    webhook_url: column.webhook_url,
    payload,
    status_code: statusCode,
    success,
    error_message: errorMessage,
  });

  return success;
}

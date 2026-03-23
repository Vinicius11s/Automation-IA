"use client";

import { toast } from "sonner";
import { useSupportOpsStore } from "@/store/supportops";

export function useMoveTicket() {
  const moveTicketOptimistic = useSupportOpsStore((state) => state.moveTicketOptimistic);

  const moveTicket = async (ticketId: string, columnId: string, position: number) => {
    const result = await moveTicketOptimistic(ticketId, columnId, position);

    if (result.webhookFired) {
      toast[result.webhookSuccess ? "success" : "error"](
        result.webhookSuccess
          ? "Webhook disparado com sucesso."
          : "Webhook disparado, mas retornou erro."
      );
    }
  };

  return { moveTicket };
}

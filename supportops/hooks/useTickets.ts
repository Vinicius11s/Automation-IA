"use client";

import { useEffect, useState } from "react";
import { useSupportOpsStore } from "@/store/supportops";

export function useTickets() {
  const tickets = useSupportOpsStore((state) => state.tickets);
  const fetchTickets = useSupportOpsStore((state) => state.fetchTickets);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    setError(null);
    setLoading(true);
    try {
      await fetchTickets();
    } catch {
      setError("Não foi possível carregar tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { tickets, loading, error, refetch };
}

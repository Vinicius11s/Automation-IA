"use client";

import { useEffect, useState } from "react";
import { useSupportOpsStore } from "@/store/supportops";

export function useColumns() {
  const columns = useSupportOpsStore((state) => state.columns);
  const fetchColumns = useSupportOpsStore((state) => state.fetchColumns);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    setError(null);
    setLoading(true);
    try {
      await fetchColumns();
    } catch {
      setError("Não foi possível carregar colunas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { columns, loading, error, refetch };
}

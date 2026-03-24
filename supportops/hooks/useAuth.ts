"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth";

/**
 * Inicializa o auth store com o perfil do usuário logado.
 * Deve ser chamado uma vez no layout raiz (client component).
 */
export function useAuth() {
  const { setProfile, setLoading, clear } = useAuthStore();

  useEffect(() => {
    const supabase = createClient();

    async function loadProfile() {
      setLoading(true);
      try {
        const res = await fetch("/api/me");
        if (!res.ok) { clear(); return; }
        const { profile } = await res.json();
        setProfile(profile ?? null);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        clear();
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        loadProfile();
      }
    });

    return () => subscription.unsubscribe();
  }, [setProfile, setLoading, clear]);

  return useAuthStore();
}

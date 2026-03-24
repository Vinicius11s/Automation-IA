"use client";

import { useAuth } from "@/hooks/useAuth";

/** Inicializa o auth store. Colocar no RootLayout (client boundary). */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  useAuth();
  return <>{children}</>;
}

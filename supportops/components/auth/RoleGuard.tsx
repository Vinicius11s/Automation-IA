"use client";

import type { UserRole } from "@/types/auth";
import { useAuthStore } from "@/store/auth";

interface Props {
  allow: UserRole;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/** Renderiza children somente se o usuário tiver a role especificada. */
export function RoleGuard({ allow, children, fallback = null }: Props) {
  const profile = useAuthStore((s) => s.profile);
  if (profile?.role !== allow) return <>{fallback}</>;
  return <>{children}</>;
}

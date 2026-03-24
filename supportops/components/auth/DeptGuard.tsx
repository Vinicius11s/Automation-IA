"use client";

import { useAuthStore } from "@/store/auth";

interface Props {
  department: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/** Renderiza children somente se o usuário puder acessar o departamento. */
export function DeptGuard({ department, children, fallback = null }: Props) {
  const canAccess = useAuthStore((s) => s.canAccessDepartment);
  if (!canAccess(department)) return <>{fallback}</>;
  return <>{children}</>;
}

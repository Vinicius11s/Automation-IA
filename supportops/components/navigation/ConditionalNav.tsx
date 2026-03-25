"use client";

import { usePathname } from "next/navigation";
import { AppNav } from "./AppNav";

const HIDE_ON: string[] = ["/login"];

export function ConditionalNav() {
  const pathname = usePathname();
  if (HIDE_ON.some((r) => pathname === r || pathname.startsWith(r + "/"))) return null;
  return <AppNav />;
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItemProps {
  href: string;
  label: string;
  icon?: React.ReactNode;
  indent?: boolean;
}

export function NavItem({ href, label, icon, indent = false }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 py-2 text-sm transition-colors duration-100 rounded-sm border-l-2",
        indent ? "text-xs pl-[30px]" : "pl-[10px]",
        isActive
          ? "bg-[#161616] text-[#ededed] border-[#ededed]"
          : "text-[#737373] hover:text-[#ededed] border-transparent"
      )}
    >
      {icon && (
        <span
          className={cn(
            "shrink-0",
            isActive ? "text-[#ededed]" : "text-[#525252]"
          )}
        >
          {icon}
        </span>
      )}
      {label}
    </Link>
  );
}

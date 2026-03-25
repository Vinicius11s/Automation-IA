"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavSectionProps {
  icon: React.ReactNode;
  label: string;
  defaultOpen?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

export function NavSection({
  icon,
  label,
  defaultOpen = false,
  disabled = false,
  children,
}: NavSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (disabled) {
    return (
      <div className="flex items-center justify-between pl-[10px] pr-3 py-2 border-l-2 border-transparent">
        <div className="flex items-center gap-2">
          <span className="text-[#333333] shrink-0">{icon}</span>
          <span className="text-sm text-[#333333]">{label}</span>
        </div>
        <span className="text-[10px] text-[#333333] font-mono">em breve</span>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between pl-[10px] pr-3 py-2 border-l-2 border-transparent text-sm text-[#737373] hover:text-[#ededed] transition-colors duration-100 rounded-sm"
      >
        <div className="flex items-center gap-2">
          <span className="text-[#525252] shrink-0">{icon}</span>
          {label}
        </div>
        <ChevronRight
          className={cn(
            "size-3 text-[#525252] transition-transform duration-150 shrink-0",
            isOpen && "rotate-90"
          )}
        />
      </button>

      {isOpen && <div className="flex flex-col mt-0.5">{children}</div>}
    </div>
  );
}

"use client";

import {
  BarChart2,
  Headphones,
  Kanban,
  LayoutDashboard,
  Megaphone,
  Settings,
  Wallet,
} from "lucide-react";
import { NavItem } from "./NavItem";
import { NavSection } from "./NavSection";

export function AppNav() {
  return (
    <nav
      aria-label="Navegação principal"
      className="flex flex-col w-[220px] shrink-0 border-r border-[#1a1a1a] bg-[#0a0a0a] h-screen"
    >
      {/* App name */}
      <div className="h-12 flex items-center px-4 border-b border-[#1a1a1a] shrink-0">
        <span className="text-sm font-semibold text-[#ededed] tracking-tight">
          SupportOps
        </span>
      </div>

      {/* Navigation items */}
      <div className="flex-1 overflow-y-auto scrollbar-none py-3 flex flex-col gap-0.5">
        {/* Painel */}
        <div className="px-2">
          <NavItem
            href="/"
            label="Painel"
            icon={<LayoutDashboard className="size-4" />}
          />
        </div>

        <div className="my-2 border-t border-[#1a1a1a] mx-3" />

        {/* Section label */}
        <div className="px-4 mb-1.5">
          <span className="section-label">Departamentos</span>
        </div>

        {/* Department sections */}
        <div className="px-2 flex flex-col gap-0.5">
          <NavSection
            icon={<Headphones className="size-4" />}
            label="Suporte / Atendimento"
            defaultOpen
          >
            <div className="px-0 flex flex-col gap-0.5">
              <NavItem
                href="/suporte"
                label="Dashboard"
                icon={<BarChart2 className="size-3" />}
                indent
              />
              <NavItem
                href="/suporte/kanban"
                label="Kanban"
                icon={<Kanban className="size-3" />}
                indent
              />
            </div>
          </NavSection>

          <NavSection
            icon={<Wallet className="size-4" />}
            label="Financeiro"
            disabled
          />

          <NavSection
            icon={<Megaphone className="size-4" />}
            label="Marketing / Vendas"
            disabled
          />
        </div>
      </div>

      {/* Bottom — Configurações */}
      <div className="px-2 py-3 border-t border-[#1a1a1a] shrink-0">
        <NavItem
          href="/configuracoes"
          label="Configurações"
          icon={<Settings className="size-4" />}
        />
      </div>
    </nav>
  );
}

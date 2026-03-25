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
import { UserInfo } from "./UserInfo";
import { RoleGuard } from "@/components/auth/RoleGuard";

export function AppNav() {
  return (
    <nav
      aria-label="Navegação principal"
      className="hidden md:flex flex-col w-[260px] shrink-0 border-r border-[#1a1a1a] bg-[#0a0a0a] h-screen"
    >
      {/* App name */}
      <div className="h-14 flex items-center px-5 border-b border-[#1a1a1a] shrink-0">
        <span className="text-sm font-semibold text-[#ededed] tracking-tight">
          RaioX Preditivo Tecnologia
        </span>
      </div>

      {/* Navigation items */}
      <div className="flex-1 overflow-y-auto scrollbar-none py-4 flex flex-col gap-0.5">
        {/* Painel */}
        <div className="px-2">
          <NavItem
            href="/"
            label="Painel"
            icon={<LayoutDashboard className="size-[18px]" />}
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
            icon={<Headphones className="size-[18px]" />}
            label="Suporte / Atendimento"
            defaultOpen
          >
            <div className="px-0 flex flex-col gap-0.5">
              <NavItem
                href="/suporte"
                label="Dashboard"
                icon={<BarChart2 className="size-3.5" />}
                indent
              />
              <NavItem
                href="/suporte/kanban"
                label="Kanban"
                icon={<Kanban className="size-3.5" />}
                indent
              />
            </div>
          </NavSection>

          <NavSection
            icon={<Wallet className="size-[18px]" />}
            label="Financeiro"
            disabled
          />

          <NavSection
            icon={<Megaphone className="size-[18px]" />}
            label="Marketing / Vendas"
            disabled
          />
        </div>
      </div>

      {/* Bottom — Admin + Configurações + Usuário */}
      <div className="flex flex-col shrink-0">
        <div className="px-2 py-4 border-t border-[#1a1a1a]">
          <RoleGuard allow="governanca">
            <NavItem
              href="/admin/usuarios"
              label="Usuários"
              icon={<Settings className="size-[18px]" />}
            />
          </RoleGuard>
          <NavItem
            href="/configuracoes"
            label="Configurações"
            icon={<Settings className="size-[18px]" />}
          />
        </div>
        <UserInfo />
      </div>
    </nav>
  );
}

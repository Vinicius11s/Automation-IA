"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth";

const DEPT_LABELS: Record<string, string> = {
  suporte: "Suporte",
  financeiro: "Financeiro",
  marketing: "Marketing",
};

const ROLE_LABELS: Record<string, string> = {
  governanca: "Governança",
  usuario: "Usuário",
};

export function UserInfo() {
  const profile = useAuthStore((s) => s.profile);
  const clear = useAuthStore((s) => s.clear);
  const router = useRouter();

  if (!profile) return null;

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    clear();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="px-3 py-3 border-t border-[#1a1a1a]">
      <div className="flex flex-col gap-0.5 mb-2 px-1">
        <span className="text-xs font-medium text-[#ededed] truncate">
          {profile.full_name}
        </span>
        <span className="text-[10px] text-[#525252]">
          {DEPT_LABELS[profile.department] ?? profile.department}
          {" · "}
          {ROLE_LABELS[profile.role] ?? profile.role}
        </span>
      </div>
      <button
        onClick={handleSignOut}
        className="w-full rounded-md border border-[#1a1a1a] px-3 py-1.5 text-[11px] text-[#737373] hover:text-[#a1a1aa] hover:border-[#262626] transition-colors text-left"
      >
        Sair
      </button>
    </div>
  );
}

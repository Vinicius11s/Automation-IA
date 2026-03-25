"use client";

import { useEffect, useState } from "react";
import { Check, Plus, RotateCcw } from "lucide-react";

interface UserRow {
  id: string;
  full_name: string;
  email: string | null;
  role: "governanca" | "usuario";
  department: string;
  active: boolean;
}

const inputCls =
  "w-full rounded-md border border-[#262626] bg-[#0a0a0a] px-3 py-2 text-xs text-[#ededed] placeholder-[#525252] focus:outline-none focus:border-[#404040] transition-colors";

const selectCls =
  "rounded-md border border-[#262626] bg-[#0a0a0a] px-3 py-2 text-sm text-[#ededed] min-w-[9.5rem] focus:outline-none focus:border-[#404040] transition-colors";

export default function UsuariosPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "usuario",
    department: "suporte",
  });

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const { users } = await res.json();
      setUsers(users);
    }
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  function setField(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setFormError(null);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowCreate(false);
      setForm({ email: "", password: "", full_name: "", role: "usuario", department: "suporte" });
      await load();
    } else {
      const data = await res.json();
      setFormError(data.error ?? "Erro ao criar usuário");
    }
    setCreating(false);
  }

  async function patch(id: string, update: Record<string, unknown>) {
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
    await load();
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-8 py-10 flex flex-col gap-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#ededed] tracking-tight">Usuários</h1>
            <p className="text-sm text-[#a1a1aa] mt-1">Gerenciar acessos e permissões</p>
          </div>
          <button
            onClick={() => { setShowCreate((v) => !v); setFormError(null); }}
            className="flex items-center gap-2 px-4 py-2 text-sm text-[#ededed] bg-[#161616] border border-[#262626] rounded-md hover:bg-[#1c1c1c] transition-colors"
          >
            <Plus className="size-4" />
            Novo usuário
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <form
            onSubmit={handleCreate}
            className="p-5 bg-[#111111] border border-[#262626] rounded-lg flex flex-col gap-4"
          >
            <p className="text-xs font-medium text-[#ededed]">Novo usuário</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-[#737373]">Nome completo</span>
                <input required value={form.full_name} onChange={(e) => setField("full_name", e.target.value)}
                  className={inputCls} placeholder="Nome Sobrenome" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-[#737373]">Email</span>
                <input required type="email" value={form.email} onChange={(e) => setField("email", e.target.value)}
                  className={inputCls} placeholder="email@empresa.com" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-[#737373]">Senha temporária</span>
                <input required type="password" minLength={6} value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  className={inputCls} placeholder="mín. 6 caracteres" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-[#737373]">Departamento</span>
                <select value={form.department} onChange={(e) => setField("department", e.target.value)} className={inputCls}>
                  <option value="suporte">Suporte</option>
                  <option value="financeiro">Financeiro</option>
                  <option value="marketing">Marketing</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-[#737373]">Role</span>
                <select value={form.role} onChange={(e) => setField("role", e.target.value)} className={inputCls}>
                  <option value="usuario">Usuário</option>
                  <option value="governanca">Governança</option>
                </select>
              </label>
            </div>
            {formError && (
              <p className="text-[11px] text-[#ef4444] bg-[#1a0a0a] border border-[#3b1010] rounded px-3 py-2">
                {formError}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="px-3 py-1.5 text-xs text-[#ededed] bg-[#1c1c1c] border border-[#333] rounded-md hover:bg-[#242424] disabled:opacity-40 transition-colors"
              >
                {creating ? "Criando..." : "Criar usuário"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-3 py-1.5 text-xs text-[#525252] hover:text-[#737373] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* User list */}
        <div className="flex flex-col gap-2">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-[#111] border border-[#1a1a1a] rounded-lg animate-pulse" />
            ))
          ) : users.length === 0 ? (
            <p className="text-sm text-[#a1a1aa] text-center py-12">Nenhum usuário cadastrado</p>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className={`flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-5 px-5 py-4 rounded-xl border transition-colors ${
                  user.active
                    ? "bg-[#111111] border-[#1a1a1a]"
                    : "bg-[#0d0d0d] border-[#161616] opacity-50"
                }`}
              >
                {/* Name + email */}
                <div className="flex-1 min-w-0 basis-full sm:basis-auto">
                  <p className="text-sm sm:text-base font-medium text-[#ededed] truncate leading-snug">
                    {user.full_name}
                  </p>
                  <p className="text-xs sm:text-sm text-[#a1a1aa] truncate mt-0.5">
                    {user.email}
                  </p>
                </div>

                {/* Role */}
                <select
                  value={user.role}
                  onChange={(e) => patch(user.id, { role: e.target.value })}
                  className={selectCls}
                >
                  <option value="usuario">Usuário</option>
                  <option value="governanca">Governança</option>
                </select>

                {/* Department */}
                <select
                  value={user.department}
                  onChange={(e) => patch(user.id, { department: e.target.value })}
                  className={selectCls}
                >
                  <option value="suporte">Suporte</option>
                  <option value="financeiro">Financeiro</option>
                  <option value="marketing">Marketing</option>
                </select>

                {/* Active toggle */}
                <button
                  onClick={() => patch(user.id, { active: !user.active })}
                  title={user.active ? "Desativar usuário" : "Reativar usuário"}
                  className="p-2 rounded-md border border-[#262626] hover:border-[#404040] transition-colors shrink-0"
                >
                  {user.active
                    ? <Check className="size-4 text-[#22c55e]" />
                    : <RotateCcw className="size-4 text-[#525252]" />
                  }
                </button>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}

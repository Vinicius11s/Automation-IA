"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ERROR_MESSAGES: Record<string, string> = {
  inactive: "Conta desativada. Entre em contato com o administrador.",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.error ? (ERROR_MESSAGES[searchParams.error] ?? null) : null
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError("Email ou senha inválidos.");
        return;
      }

      // Middleware lê o JWT e redireciona para a rota correta por role/dept
      router.push("/");
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-sm font-bold text-[#ededed] tracking-tight">
            RaioX Preditivo Tecnologia
          </h1>
          <p className="text-xs text-[#525252] mt-1">Painel interno de automação</p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-[#1a1a1a] bg-[#111111] p-6">
          <h2 className="text-sm font-medium text-[#ededed] mb-5">Entrar</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-[#737373]">Email</span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-md border border-[#262626] bg-[#0a0a0a] px-3 py-2 text-xs text-[#ededed] placeholder-[#525252] focus:outline-none focus:border-[#404040] transition-colors"
                placeholder="seu@email.com"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-[#737373]">Senha</span>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-md border border-[#262626] bg-[#0a0a0a] px-3 py-2 text-xs text-[#ededed] placeholder-[#525252] focus:outline-none focus:border-[#404040] transition-colors"
                placeholder="••••••••"
              />
            </label>

            {error && (
              <p className="text-[11px] text-[#ef4444] bg-[#1a0a0a] border border-[#3b1010] rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="mt-1 rounded-md border border-[#262626] bg-[#1c1c1c] px-4 py-2 text-xs text-[#ededed] hover:bg-[#242424] disabled:opacity-40 transition-colors"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

const PUBLIC_ROUTES = ["/login"];
const DEPARTMENTS = ["suporte", "financeiro", "marketing"];

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

function extractDepartment(pathname: string): string | null {
  const segment = pathname.split("/")[1];
  return DEPARTMENTS.includes(segment) ? segment : null;
}

/** Decode JWT payload without verification (Supabase already verified it). */
function decodeJwtClaims(token: string) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export async function refreshSession(request: NextRequest) {
  const { url, anonKey } = getSupabaseEnv();

  const response = NextResponse.next({ request: { headers: request.headers } });

  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Sempre validar o usuário (recomendado pelo @supabase/ssr)
  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // Rotas públicas — sem verificação
  if (isPublicRoute(pathname)) {
    // Redirecionar usuário já logado para fora do login
    if (user) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return response;
  }

  // Sem sessão → login
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ── Ler claims do JWT (D2 — fast path, sem query ao banco) ──
  const { data: { session } } = await supabase.auth.getSession();
  const claims = session?.access_token ? decodeJwtClaims(session.access_token) : null;

  let userRole: string | null = claims?.user_role ?? null;
  let userDepartment: string | null = claims?.user_department ?? null;
  let userActive: boolean = claims?.user_active ?? true;

  // Fallback: query ao banco se hook ainda não foi configurado
  if (!userRole) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, department, active")
      .eq("id", user.id)
      .single();

    userRole = profile?.role ?? null;
    userDepartment = profile?.department ?? null;
    userActive = profile?.active ?? false;
  }

  // Usuário inativo
  if (!userActive) {
    return NextResponse.redirect(new URL("/login?error=inactive", request.url));
  }

  // Governança: acesso total
  if (userRole === "governanca") return response;

  // Bloquear /admin para não-governança
  if (pathname.startsWith("/admin")) {
    return NextResponse.redirect(
      new URL(`/${userDepartment}/kanban`, request.url)
    );
  }

  // Rota raiz "/" → redirecionar usuario para seu kanban
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(`/${userDepartment}/kanban`, request.url)
    );
  }

  // Verificar acesso ao departamento solicitado
  const requestedDept = extractDepartment(pathname);
  if (requestedDept && requestedDept !== userDepartment) {
    return NextResponse.redirect(
      new URL(`/${userDepartment}/kanban`, request.url)
    );
  }

  return response;
}

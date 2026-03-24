# PRD — Autenticação, Usuários e RBAC
**Versão:** 1.0
**Data:** 2026-03-24
**Status:** Pronto para implementação
**Skills alvo:** `nextjs-supabase-auth`, `supabase-nextjs`, `supabase-postgres-best-practices`, `vercel-react-best-practices`

---

## 1. Visão Geral

Este documento especifica a implementação de autenticação, gerenciamento de usuários e controle de acesso baseado em perfil (RBAC) para o sistema RaioX Preditivo Tecnologia.

O sistema é multi-departamento. Cada usuário pertence a exatamente um departamento e possui um perfil que determina o escopo de acesso. A autenticação é gerenciada pelo **Supabase Auth**. A autorização é aplicada em três camadas: banco de dados (RLS), servidor (middleware Next.js) e frontend (guards de componente).

---

## 2. Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router) |
| Linguagem | TypeScript |
| Auth | Supabase Auth (`@supabase/ssr`) |
| Banco | Supabase PostgreSQL |
| ORM | Supabase JS Client (já em uso) |
| Estado global | Zustand |
| UI | Tailwind v4 + shadcn `base-nova` |
| Middleware | `middleware.ts` do Next.js |

---

## 3. Perfis de Acesso (Roles)

### 3.1 Definição

| Role | Identificador | Descrição |
|---|---|---|
| Governança | `governanca` | Acesso total a todos os departamentos |
| Usuário | `usuario` | Acesso restrito ao próprio departamento |

### 3.2 Matriz de Permissões

| Recurso | `governanca` | `usuario` |
|---|---|---|
| Ver todos os departamentos | ✅ | ❌ |
| Ver próprio departamento | ✅ | ✅ |
| Acessar qualquer Kanban | ✅ | ❌ |
| Acessar Kanban do próprio depto | ✅ | ✅ |
| Cadastrar usuários | ✅ | ❌ |
| Criar/editar colunas | ✅ | ✅ |
| Criar/editar tickets | ✅ | ✅ |
| Atribuir tickets | ✅ | ✅ |
| Ver painel global `/` | ✅ | ❌ (redireciona ao próprio depto) |
| Acessar `/admin/*` | ✅ | ❌ |

---

## 4. Modelo de Dados

### 4.1 Tabelas novas

#### `profiles`
Extensão da tabela `auth.users` do Supabase. Criada via trigger automático no cadastro.

```sql
CREATE TABLE public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text NOT NULL,
  role        text NOT NULL CHECK (role IN ('governanca', 'usuario')),
  department  text NOT NULL,             -- ex: 'suporte', 'financeiro', 'marketing'
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
```

**Constraints:**
- `role` deve ser `'governanca'` ou `'usuario'`
- `department` deve corresponder a um valor existente na tabela `departments`
- Um usuário com role `governanca` pode ter `department = 'todos'` (DECISÃO A SER TOMADA: se governança precisa de departamento base ou não)

---

#### `departments`
Tabela de referência dos departamentos do sistema.

```sql
CREATE TABLE public.departments (
  id          text PRIMARY KEY,          -- ex: 'suporte', 'financeiro', 'marketing'
  label       text NOT NULL,             -- ex: 'Suporte / Atendimento'
  active      boolean NOT NULL DEFAULT true,
  position    integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Seed inicial
INSERT INTO public.departments (id, label, active, position) VALUES
  ('suporte',    'Suporte / Atendimento', true,  0),
  ('financeiro', 'Financeiro',            false, 1),
  ('marketing',  'Marketing / Vendas',    false, 2);
```

---

### 4.2 Alterações em tabelas existentes

#### `tickets`
O campo `assignee` atualmente é `text` livre. Será tipado como FK para `profiles`.

```sql
-- Migração: converter assignee para UUID FK
ALTER TABLE public.tickets
  ADD COLUMN assignee_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Após migração de dados, remover campo antigo (DECISÃO A SER TOMADA: manter ou remover assignee text)
```

**Nota:** Durante a transição, manter `assignee text` e `assignee_id uuid` em paralelo até migração completa.

---

### 4.3 Row Level Security (RLS)

#### `profiles`

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Usuário lê somente o próprio perfil
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Governança lê todos os perfis
CREATE POLICY "profiles_select_governanca"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'governanca'
    )
  );

-- Somente governança insere/atualiza perfis
CREATE POLICY "profiles_insert_governanca"
  ON public.profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'governanca'
    )
  );

CREATE POLICY "profiles_update_governanca"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'governanca'
    )
  );
```

#### `tickets`

```sql
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Governança acessa todos os tickets
CREATE POLICY "tickets_governanca_all"
  ON public.tickets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'governanca'
    )
  );

-- Usuário acessa somente tickets do seu departamento
CREATE POLICY "tickets_usuario_own_dept"
  ON public.tickets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'usuario'
        AND p.department = tickets.department
    )
  );
```

#### `columns`

```sql
ALTER TABLE public.columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "columns_governanca_all"
  ON public.columns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'governanca'
    )
  );

CREATE POLICY "columns_usuario_own_dept"
  ON public.columns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'usuario'
        AND p.department = columns.department
    )
  );
```

---

### 4.4 Trigger: auto-criação de perfil

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Perfil é criado via cadastro manual pela governança
  -- Este trigger apenas garante que o registro não fique órfão
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Nota:** Perfis NÃO são criados automaticamente no signup. A governança cadastra o usuário via painel `/admin/usuarios`, que cria o `auth.users` via `supabase.auth.admin.createUser()` e insere em `profiles` na mesma transação.

---

## 5. Autenticação

### 5.1 Fluxo de Login

```
Usuário acessa qualquer rota protegida
  └─ middleware.ts verifica sessão Supabase
       ├─ Sem sessão → redirect para /login
       └─ Com sessão → busca profile → verifica role/department → permite ou redireciona
```

### 5.2 Página de Login

**Rota:** `/login`
**Componente:** `app/login/page.tsx`
**Comportamento:**
- Formulário com campos `email` e `password`
- Chama `supabase.auth.signInWithPassword({ email, password })`
- Em caso de erro: exibe mensagem genérica `"Email ou senha inválidos"` (não diferenciar os dois para segurança)
- Em caso de sucesso:
  - Role `governanca` → redirect para `/` (painel global)
  - Role `usuario` → redirect para `/{department}/kanban` (ex: `/suporte/kanban`)
- Sessão persiste via cookies httpOnly gerenciados pelo `@supabase/ssr`

### 5.3 Logout

- Botão "Sair" visível na nav para todos os usuários autenticados
- Chama `supabase.auth.signOut()`
- Redirect para `/login`
- Cookies de sessão são invalidados

### 5.4 Persistência de Sessão

- Gerenciada pelo `@supabase/ssr` via cookies httpOnly
- `middleware.ts` atualiza o token automaticamente a cada request (refresh transparente)
- Sem `localStorage` — 100% server-side cookies

### 5.5 Tratamento de Erros

| Cenário | Comportamento |
|---|---|
| Email não existe | Mensagem genérica (não revelar) |
| Senha errada | Mensagem genérica (não revelar) |
| Conta desativada | `"Conta desativada. Entre em contato com o administrador."` |
| Sessão expirada | Redirect automático para `/login` via middleware |
| Erro de rede | `"Erro de conexão. Tente novamente."` |

---

## 6. Middleware de Proteção de Rotas

**Arquivo:** `middleware.ts` (raiz do projeto)

### 6.1 Rotas públicas (sem autenticação)

```
/login
/login/*
```

### 6.2 Rotas protegidas e regras

| Rota | `governanca` | `usuario` |
|---|---|---|
| `/` | ✅ | ❌ → redirect `/{seu_dept}/kanban` |
| `/admin/*` | ✅ | ❌ → redirect `/{seu_dept}/kanban` |
| `/suporte/*` | ✅ | ✅ (se `department === 'suporte'`) |
| `/financeiro/*` | ✅ | ✅ (se `department === 'financeiro'`) |
| `/marketing/*` | ✅ | ✅ (se `department === 'marketing'`) |
| `/{outro_dept}/*` | ✅ | ❌ → redirect `/{seu_dept}/kanban` |

### 6.3 Lógica do middleware

```typescript
// Pseudocódigo — não é implementação final
export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request)
  const { data: { session } } = await supabase.auth.getSession()

  // Rota pública
  if (isPublicRoute(request.pathname)) return response

  // Sem sessão → login
  if (!session) return redirect('/login')

  // Buscar profile (cacheado no cookie ou re-fetch)
  const profile = await getProfile(supabase, session.user.id)

  // Governança: acesso total
  if (profile.role === 'governanca') return response

  // Usuário: verificar se rota pertence ao seu departamento
  const requestedDept = extractDepartmentFromPath(request.pathname)
  if (requestedDept && requestedDept !== profile.department) {
    return redirect(`/${profile.department}/kanban`)
  }

  // Bloquear /admin para usuários
  if (request.pathname.startsWith('/admin')) {
    return redirect(`/${profile.department}/kanban`)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
```

**Nota de performance:** O profile deve ser lido do JWT claims customizados (via `auth.users.raw_app_meta_data`) para evitar query ao banco em todo request. Alternativa: cookie próprio com TTL curto. **DECISÃO A SER TOMADA.**

---

## 7. Contexto de Autenticação no Frontend

### 7.1 Hook `useAuth`

**Arquivo:** `hooks/useAuth.ts`

```typescript
// Interface esperada (não implementação)
interface AuthContext {
  user: User | null           // auth.users
  profile: Profile | null     // public.profiles
  isGovernanca: boolean
  department: string | null
  loading: boolean
  signOut: () => Promise<void>
}
```

- Utiliza `supabase.auth.onAuthStateChange` para reatividade
- Profile é buscado uma vez e armazenado no Zustand ou Context
- Exposto via `useAuth()` em qualquer componente

### 7.2 Zustand — AuthStore

**Arquivo:** `store/auth.ts` (novo arquivo, separado do `supportops.ts`)

```typescript
interface AuthStore {
  profile: Profile | null
  setProfile: (profile: Profile | null) => void
  isGovernanca: () => boolean
  canAccessDepartment: (dept: string) => boolean
}
```

### 7.3 Guard de Componente

```typescript
// Componente guard para uso inline
<RoleGuard allow="governanca">
  <BotaoAdministrativo />
</RoleGuard>

// Componente guard com fallback
<DeptGuard department="suporte" fallback={<AcessoNegado />}>
  <KanbanBoard />
</DeptGuard>
```

---

## 8. Gerenciamento de Usuários (Admin)

### 8.1 Rota

**Prefixo:** `/admin/usuarios`
**Acesso:** somente `governanca`

### 8.2 Listagem de Usuários

**GET `/admin/usuarios`**
- Lista todos os profiles com: nome, email (de `auth.users`), role, departamento, data de criação
- Filtros: por departamento, por role
- Não paginado inicialmente (DECISÃO A SER TOMADA para escala)

### 8.3 Cadastro de Usuário

**Rota:** `/admin/usuarios/novo`
**API:** `POST /api/admin/usuarios`

Campos do formulário:
| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| Nome completo | text | ✅ | mín. 3 chars |
| Email | email | ✅ | único no sistema |
| Senha temporária | text | ✅ | mín. 8 chars |
| Perfil | select | ✅ | `governanca` \| `usuario` |
| Departamento | select | ✅ | valores de `departments` |

**Fluxo de criação:**
1. `supabase.auth.admin.createUser({ email, password, email_confirm: true })`
2. `INSERT INTO profiles (id, full_name, role, department) VALUES (...)`
3. Usuário recebe email com credenciais (DECISÃO A SER TOMADA: envio de email ou exibir senha na tela)

**API Route:** `app/api/admin/usuarios/route.ts`
- Usar `createClient()` com `SERVICE_ROLE_KEY` (nunca `anon`)
- Verificar que o solicitante é `governanca` antes de executar

### 8.4 Edição de Usuário

**PUT `/api/admin/usuarios/[id]`**
- Campos editáveis: `full_name`, `role`, `department`
- Email e senha: fluxo separado (reset de senha via Supabase Auth)
- Não é possível rebaixar o último `governanca` do sistema

### 8.5 Desativação de Usuário

- Não deletar: desativar via `supabase.auth.admin.updateUserById(id, { ban_duration: 'none' })`
- DECISÃO A SER TOMADA: campo `active boolean` em `profiles` ou usar ban nativo do Supabase

---

## 9. Integração com Kanban

### 9.1 Filtro por Departamento

O Kanban já filtra por `department` via query string (`?department=suporte`). Com RBAC:
- `governanca`: pode trocar departamento via selector na topbar
- `usuario`: department fixado no profile, não há selector

### 9.2 Atribuição de Tickets

**Campo afetado:** `tickets.assignee_id` (novo FK para `profiles`)

**Fluxo de atribuição no AssignModal:**
1. Buscar usuários do mesmo departamento do ticket: `SELECT * FROM profiles WHERE department = {ticket.department}`
2. Governança vê todos os usuários de todos os departamentos
3. Exibir lista de nomes para seleção
4. Salvar `assignee_id` no ticket

**Exibição do responsável no TicketCard:**
- Mostrar iniciais do nome ou nome completo truncado
- Tooltip com nome completo no hover

### 9.3 Filtro por Responsável na Topbar

Na `KanbanTopBar`, adicionar filtro "Responsável":
- Select com usuários do departamento atual
- Opção "Todos" (padrão)
- Filtra tickets no estado local (Zustand) sem re-fetch

---

## 10. Interface de Usuário

### 10.1 AppNav — informações do usuário logado

Na parte inferior da sidebar (`AppNav.tsx`), acima de "Configurações":

```
┌─────────────────────────┐
│ João Silva              │
│ Suporte · Usuário       │  ← nome · departamento · role
│ [Sair]                  │
└─────────────────────────┘
```

- Nome: `profile.full_name`
- Departamento: label amigável do departamento
- Badge de role: `"Governança"` ou `"Usuário"` (texto simples, sem cor de destaque — seguindo design Vercel-like)

### 10.2 Painel `/` (Home)

- `governanca`: vê todos os cards de departamentos (Suporte, Financeiro, Marketing)
- `usuario`: redireciona automaticamente para `/{department}/kanban` — nunca vê o painel global

### 10.3 Indicadores de acesso negado

- Não usar páginas de erro 403 genéricas
- Redirecionar silenciosamente para a rota correta do usuário
- Toast discreto: `"Você foi redirecionado para o seu departamento"` (apenas na primeira vez)

### 10.4 Selector de Departamento (somente Governança)

Na `KanbanTopBar`, somente para `governanca`:
- Dropdown com todos os departamentos ativos
- Troca o contexto sem recarregar a página (Zustand + re-fetch de tickets/colunas)
- URL reflete o departamento: `/suporte/kanban`, `/financeiro/kanban`

---

## 11. API Routes — Controle de Acesso

Todas as API routes devem verificar autenticação e autorização no servidor.

### 11.1 Padrão de verificação

```typescript
// Padrão obrigatório em toda API route protegida
async function handler(request: NextRequest) {
  const supabase = createClient() // server client com cookies
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, department')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 403 })

  // Para rotas de admin:
  if (profile.role !== 'governanca') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  // Para rotas de departamento:
  const dept = request.nextUrl.searchParams.get('department')
  if (profile.role === 'usuario' && dept !== profile.department) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  // ... lógica da route
}
```

### 11.2 Novas API Routes

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/api/admin/usuarios` | `governanca` | Listar todos os usuários |
| POST | `/api/admin/usuarios` | `governanca` | Cadastrar usuário |
| PUT | `/api/admin/usuarios/[id]` | `governanca` | Editar usuário |
| PATCH | `/api/admin/usuarios/[id]` | `governanca` | Desativar usuário |
| GET | `/api/me` | autenticado | Retorna profile do usuário logado |
| GET | `/api/departments` | autenticado | Lista departamentos ativos |

---

## 12. Estrutura de Arquivos — Novos Arquivos

```
supportops/
├── app/
│   ├── login/
│   │   └── page.tsx                    # Página de login
│   ├── admin/
│   │   └── usuarios/
│   │       ├── page.tsx                # Lista de usuários
│   │       └── novo/
│   │           └── page.tsx            # Formulário de cadastro
│   └── api/
│       ├── me/
│       │   └── route.ts                # GET /api/me
│       ├── departments/
│       │   └── route.ts                # GET /api/departments
│       └── admin/
│           └── usuarios/
│               ├── route.ts            # GET + POST
│               └── [id]/
│                   └── route.ts        # PUT + PATCH
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx               # Formulário de login
│   │   ├── RoleGuard.tsx               # Guard por role
│   │   └── DeptGuard.tsx               # Guard por departamento
│   └── navigation/
│       └── UserInfo.tsx                # Bloco de usuário na nav
├── hooks/
│   └── useAuth.ts                      # Hook de autenticação
├── store/
│   └── auth.ts                         # Zustand AuthStore
├── lib/
│   └── supabase/
│       └── admin.ts                    # Client com SERVICE_ROLE_KEY
└── middleware.ts                       # Proteção de rotas (já existe, expandir)
```

---

## 13. Variáveis de Ambiente

Adicionar ao `.env.example`:

```bash
# Supabase Service Role — somente server-side, NUNCA expor no client
# Necessário para criar usuários via admin API
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # já existe no projeto
```

Nenhuma nova variável necessária além das já existentes.

---

## 14. Estratégia de Migração

### Fase 1 — Banco de dados
1. Criar tabela `departments` com seed
2. Criar tabela `profiles` com RLS
3. Adicionar coluna `assignee_id` em `tickets` (nullable, sem remover `assignee`)
4. Habilitar RLS em `tickets` e `columns`

### Fase 2 — Autenticação
1. Implementar `middleware.ts` com proteção de rotas
2. Implementar `/login` page
3. Implementar `useAuth` hook e `AuthStore`
4. Adicionar `UserInfo` na nav

### Fase 3 — Admin
1. Implementar `/admin/usuarios` (listagem + cadastro)
2. Implementar API routes de admin

### Fase 4 — Integração Kanban
1. Migrar `assignee` text → `assignee_id` uuid no `AssignModal`
2. Implementar filtro por responsável na topbar
3. Selector de departamento para governança

### Fase 5 — Hardening
1. Auditoria de todas as API routes existentes (adicionar verificação de auth)
2. Testes de RLS (verificar que usuário B não acessa dados do departamento A)
3. Verificar que `SERVICE_ROLE_KEY` não é exposta em nenhum bundle client

---

## 15. Decisões — FECHADAS

| # | Decisão | Resolução |
|---|---|---|
| D1 | Governança tem departamento base? | ✅ **Departamento real + role `governanca`**. Acesso global controlado pela role, não por valor especial. Mantém consistência no RLS. |
| D2 | Cache do profile no middleware | ✅ **JWT claims enriquecidos** com `role` e `department`. Zero queries por request no middleware. Atualizar claims ao editar perfil. |
| D3 | Comunicar senha ao novo usuário | ✅ **Email nativo do Supabase** (link de definição de senha). Nenhuma senha trafega por WhatsApp ou tela. |
| D4 | Desativação de usuário | ✅ **Campo `active boolean` em `profiles`** (soft delete). Ban nativo do Supabase como camada adicional, não como regra principal. |
| D5 | Migração do campo `assignee` | ✅ **Paralelo temporário**: manter `assignee text` e `assignee_id uuid` até validação. Remover `assignee` em migration controlada posterior. |
| D6 | Paginação em `/admin/usuarios` | ✅ **Cursor-based desde o início** (`created_at` + `id` como cursor). Evita retrabalho no futuro. |

### Impactos das decisões no modelo de dados

**D1 → RLS simplificado:**
```sql
-- Governança: acessa tudo pela role, não pelo department
CREATE POLICY "tickets_governanca_all" ON public.tickets FOR ALL
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'governanca'
);
```

**D2 → JWT claims enriquecidos:**
```sql
-- Função para injetar role e department no JWT
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  claims jsonb;
  profile record;
BEGIN
  SELECT role, department, active
  INTO profile
  FROM public.profiles
  WHERE id = (event->>'user_id')::uuid;

  claims := event->'claims';
  claims := jsonb_set(claims, '{user_role}', to_jsonb(profile.role));
  claims := jsonb_set(claims, '{user_department}', to_jsonb(profile.department));
  claims := jsonb_set(claims, '{user_active}', to_jsonb(profile.active));

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;
```
Habilitar em: Supabase Dashboard → Auth → Hooks → `custom_access_token_hook`

**D4 → Campo `active` em profiles:**
```sql
ALTER TABLE public.profiles ADD COLUMN active boolean NOT NULL DEFAULT true;

-- RLS: bloquear usuários inativos
CREATE POLICY "block_inactive_users" ON public.profiles FOR ALL
USING (active = true OR auth.uid() = id);
```

**D6 → Cursor-based pagination:**
```typescript
// Padrão de query para /api/admin/usuarios
const { data } = await supabase
  .from('profiles')
  .select('*')
  .order('created_at', { ascending: false })
  .order('id', { ascending: false })
  .limit(20)
  .lt('created_at', cursor ?? 'infinity') // cursor do request anterior
```

---

## 16. Não está no escopo deste PRD

- Recuperação de senha (usar fluxo nativo do Supabase Auth — email de reset)
- OAuth / login social
- MFA (multi-fator)
- Auditoria de ações (log de quem fez o quê)
- Permissões granulares por recurso (ex: só ver tickets atribuídos a si)
- API pública / tokens de API

---

*Documento gerado em 2026-03-24. Próximo passo: resolver Decisões em Aberto (seção 15) antes de iniciar implementação.*

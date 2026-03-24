-- ============================================================
-- MIGRATION 001 — Auth / RBAC
-- Executar no Supabase Dashboard → SQL Editor
-- Ordem: rodar na sequência abaixo
-- ============================================================

-- ─── 1. Departments ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.departments (
  id        text PRIMARY KEY,
  label     text NOT NULL,
  active    boolean NOT NULL DEFAULT true,
  position  integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.departments (id, label, active, position) VALUES
  ('suporte',    'Suporte / Atendimento', true,  0),
  ('financeiro', 'Financeiro',            false, 1),
  ('marketing',  'Marketing / Vendas',    false, 2)
ON CONFLICT (id) DO NOTHING;

-- ─── 2. Profiles ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text NOT NULL,
  role        text NOT NULL CHECK (role IN ('governanca', 'usuario')),
  department  text NOT NULL REFERENCES public.departments(id),
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── 3. RLS — profiles ───────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Usuário lê o próprio perfil
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Governança lê todos os perfis
CREATE POLICY "profiles_select_governanca"
  ON public.profiles FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'governanca'
  );

-- Somente governança insere perfis
CREATE POLICY "profiles_insert_governanca"
  ON public.profiles FOR INSERT
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'governanca'
  );

-- Somente governança atualiza perfis
CREATE POLICY "profiles_update_governanca"
  ON public.profiles FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'governanca'
  );

-- ─── 4. RLS — tickets ────────────────────────────────────────
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Governança acessa todos os tickets
CREATE POLICY "tickets_governanca_all"
  ON public.tickets FOR ALL
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'governanca'
  );

-- Usuário acessa somente tickets do seu departamento
CREATE POLICY "tickets_usuario_own_dept"
  ON public.tickets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'usuario'
        AND p.department = public.tickets.department
    )
  );

-- ─── 5. RLS — columns ────────────────────────────────────────
ALTER TABLE public.columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "columns_governanca_all"
  ON public.columns FOR ALL
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'governanca'
  );

CREATE POLICY "columns_usuario_own_dept"
  ON public.columns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'usuario'
        AND p.department = public.columns.department
    )
  );

-- ─── 6. assignee_id em tickets ───────────────────────────────
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS assignee_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ─── 7. Auth Hook — JWT claims enriquecidos (D2) ─────────────
-- ATENÇÃO: Após rodar este SQL, configurar no Supabase Dashboard:
-- Authentication → Hooks → Custom Access Token Hook
-- Function: public.custom_access_token_hook

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims    jsonb;
  p         record;
BEGIN
  SELECT role, department, active
  INTO p
  FROM public.profiles
  WHERE id = (event->>'user_id')::uuid;

  claims := event->'claims';

  IF p.role IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_role}',       to_jsonb(p.role));
    claims := jsonb_set(claims, '{user_department}', to_jsonb(p.department));
    claims := jsonb_set(claims, '{user_active}',     to_jsonb(p.active));
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Permissão para o auth hook executar a função
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
GRANT SELECT ON public.profiles TO supabase_auth_admin;

-- ─── 8. departments — RLS (leitura pública para autenticados) ─
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "departments_select_authenticated"
  ON public.departments FOR SELECT
  TO authenticated
  USING (true);

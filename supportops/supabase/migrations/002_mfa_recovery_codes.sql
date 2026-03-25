-- ============================================================
-- 002_mfa_recovery_codes.sql
-- Códigos de recuperação para autenticação de dois fatores
-- ============================================================

CREATE TABLE IF NOT EXISTS public.mfa_recovery_codes (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash  text        NOT NULL,
  used       boolean     NOT NULL DEFAULT false,
  used_at    timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mfa_recovery_user
  ON public.mfa_recovery_codes (user_id);

ALTER TABLE public.mfa_recovery_codes ENABLE ROW LEVEL SECURITY;

-- Usuário pode ver (contar) apenas os próprios códigos
CREATE POLICY "mfa_recovery_select_own"
  ON public.mfa_recovery_codes
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT / UPDATE / DELETE: apenas service role (via Admin client — bypassa RLS)

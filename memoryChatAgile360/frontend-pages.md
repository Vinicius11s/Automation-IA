# Estado atual das páginas — Frontend Agile360
> Data: 2026-03-22

## ✅ Páginas reformuladas (Ouro Jurídico completo)

### `/` — Landing Page (v4.0)
**Arquivo:** `frontend/src/pages/Landing.tsx` + `Landing.css`
**Status:** Completo, cinematográfico
**Destaques:**
- Navbar com `logoAgile.png` + item ativo em ouro
- Hero: credibilidade "Escritórios que lideram já automatizaram com IA"
  (traços dourados flanqueando o texto — substituiu pill badge)
- Grain overlay, ambient glow, grid sutil
- Dashboard Preview com perspectiva CSS (rotateX → straighten no scroll)
- Countdown ao vivo para prazos fatais (`useCountdown` hook)
- Counters animados nas métricas (`useCountUp` hook)
- Footer completo com selos LGPD · AES-256 · MFA
- Seções: Hero, Funcionalidades, Dashboard Preview, CTA Final

### `/login` — Login (v4.0)
**Arquivo:** `frontend/src/pages/Login.tsx` + `Login.css`
**Status:** Completo, cinematográfico
**Destaques:**
- Full-screen dark (#0D0D0D), sem Navbar
- `logoAgile.png` como link para home (40px)
- Headline Instrument Serif italic: "Bem-vindo de volta."
- Inputs com ícones (Mail, Lock), caret dourado, focus ring ouro
- Botão gold shimmer full-width com spinner nativo
- Erro com AlertCircle em box rosé
- "Esqueci minha senha" link discreto
- "Solicitar demonstração" para registro
- Footer: © 2025 Agile360 · LGPD Compliant · AES-256
- Toda lógica preservada: handleSubmit, MFA redirect, returnUrl

### `/mfa-challenge` — MFA (v4.0)
**Arquivo:** `frontend/src/pages/MfaChallenge.tsx` + `MfaChallenge.css`
**Status:** Completo, cinematográfico
**Destaques:**
- Mesma atmosfera do Login (sem Navbar)
- `logoAgile.png` (40px)
- ShieldCheck com anel dourado pulsante (mfa-shield-pulse)
- **6 inputs individuais** para dígitos TOTP:
  - Auto-focus no próximo ao digitar
  - Backspace volta ao anterior
  - Arrows Left/Right navegam
  - Suporte a colar 6 dígitos de uma vez
  - `.filled` class + `mfa-digit-pop` micro-animação
  - Separador central: `[3] · [3]`
- **Auto-submit** no preenchimento do 6º dígito
- Shake animation na linha inteira quando erro
- Modo recovery: input único XXXX-XXXX
- Transição suave entre modos com `key={mode}` + fade-in
- "Usar código de recuperação" / "Voltar ao autenticador"
- Footer: © 2025 Agile360 · LGPD Compliant · AES-256

### `/app` — Dashboard (v3.0)
**Arquivo:** `frontend/src/pages/DashboardHome.tsx`
**Layout:** `frontend/src/layouts/DashboardLayout.tsx`
**Status:** Elevado com Ouro Jurídico
**Destaques:**

**Sidebar:**
- `logoAgile.png` (28px)
- Navegação em 3 grupos: (sem label), "Gestão", "Sistema"
- Item ativo: borda ouro + background ouro muted
- Avatar: iniciais 2 letras, fundo ouro dim, borda ouro sutil
- OAB exibida se disponível (senão email)
- Botões Tema/Sair com hover: ouro vs vermelho + borda responsiva

**DashboardHome:**
- Saudação em Instrument Serif italic: "Boa tarde, *Nome*." (nome em ouro)
- `useCountUp` hook — números animam 0→valor em 900ms ease-out cúbico
- SummaryCard: número 2.5rem, inset glow dourado, badge ATENÇÃO nos fatais
- SectionLabel: gradiente ouro bilateral nas linhas
- Calendário: dia atual com boxShadow dourado (#0D0D0D text)
- TIPO_CONFIG: Audiência em ouro
- PROCESSO_STATUS: Ativo em ouro
- Prazos fatais ≤3 dias: **dot vermelho animate-ping** + fundo rosé

## ⚪ Páginas não reformuladas (ainda no design original)
- `/app/clientes` — Clientes.tsx (CRUD funcional, design antigo)
- `/app/processos` — Processos.tsx (CRUD funcional, design antigo)
- `/app/prazos` — Prazos.tsx (CRUD funcional, design antigo)
- `/app/audiencias` — Audiencias.tsx (CRUD funcional, design antigo)
- `/app/staging` — Staging* (aprovações WhatsApp, design antigo)
- `/app/configuracoes` — SecuritySettings, MinhaConta (design antigo)
- `/register` — Register.tsx (design antigo)
- `/forgot-password` — ForgotPassword.tsx (design antigo)
- `/reset-password` — ResetPassword.tsx (design antigo)

## Navbar pública
**Arquivo:** `frontend/src/components/Navbar.tsx`
- `logoAgile.png` (32px)
- Cor primária agora é ouro (var(--color-primary) = #C9A84C)
- Botão "Entrar" usa ouro automaticamente
- Só aparece na Landing (routes auth estão fora do PublicLayout)

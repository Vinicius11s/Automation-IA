# Contexto do Projeto — Agile360

## O que é
SaaS jurídico brasileiro que conecta WhatsApp ao banco de dados do escritório via IA.
Público: advogados e escritórios de advocacia no Brasil.
Tagline atual: "Nunca mais perca um prazo."

## Repositório
`C:\Users\vinih\OneDrive\Documents\GitHub\agile360`

## Stack
- **Frontend:** React + TypeScript + Vite
- **CSS:** Tailwind CSS v3.4 + CSS Variables (inline styles para theming dinâmico)
- **UI Components:** shadcn/ui (style: "default", baseColor: "slate", cssVariables: true)
- **Icons:** lucide-react
- **Routing:** React Router v6
- **Fonts:** Inter (UI), JetBrains Mono (código), Instrument Serif (display/headlines)
- **Backend:** API REST em `VITE_API_URL`, endpoints `/api/*`
- **Auth:** JWT + Refresh Token + MFA TOTP (Google Authenticator)

## Arquitetura frontend
```
frontend/src/
├── pages/
│   ├── Landing.tsx / Landing.css       ← Landing page v4.0 "Ouro Jurídico"
│   ├── Login.tsx / Login.css           ← Login cinematográfico
│   ├── MfaChallenge.tsx / MfaChallenge.css ← MFA com 6 inputs individuais
│   ├── DashboardHome.tsx               ← Painel principal
│   ├── Clientes.tsx                    ← CRUD clientes + import .xlsx
│   ├── Processos.tsx                   ← CRUD processos
│   ├── Prazos.tsx                      ← CRUD prazos + auto-cálculo datas
│   ├── Audiencias.tsx                  ← CRUD compromissos
│   ├── StagingClientes/Processos/etc   ← Aprovações via WhatsApp
│   ├── SecuritySettings.tsx            ← 2FA / MFA
│   └── MinhaConta.tsx                  ← Perfil do usuário
├── layouts/
│   ├── DashboardLayout.tsx             ← Sidebar + mobile nav
│   ├── PublicLayout.tsx                ← Só para Landing (tem Navbar)
│   └── SettingsLayout.tsx              ← Menu de configurações
├── components/
│   ├── Navbar.tsx                      ← Header público (apenas Landing)
│   ├── Button.tsx / Card.tsx / Input.tsx / Modal.tsx / Combobox.tsx
│   └── ProtectedRoute.tsx
├── context/
│   ├── AuthContext.tsx                 ← Login, logout, MFA, Profile
│   └── ThemeContext.tsx                ← dark/light via data-theme + localStorage
├── api/
│   ├── client.ts                       ← HTTP base, 401 → logout automático
│   ├── dashboard.ts                    ← GET /api/dashboard/resumo
│   ├── clientes.ts / processos.ts / prazos.ts / compromissos.ts / staging.ts
└── index.css                           ← Design tokens globais
```

## Roteamento (App.tsx)
- `/` → Landing (com PublicLayout = tem Navbar)
- `/login`, `/register`, `/forgot-password`, `/reset-password`, `/mfa-challenge`
  → Sem layout (sem Navbar — páginas full-screen cinematográficas)
- `/app/*` → DashboardLayout (ProtectedRoute)

## Tipos principais
```typescript
type Profile = { id, nome, email, oab }
type DashboardContadores = { audiencias_hoje, atendimentos_hoje, prazos_fatais, novos_processos_mes }
type CompromissoDashboard = { id, tipo, is_active, data, hora, local, id_processo }
type ProcessoDashboard = { id, num_processo, status, assunto, tribunal, criado_em }
type PrazoDashboard = { id, titulo, status, prioridade, data_vencimento, id_processo, id_cliente }
type StatusProcesso = 'Ativo' | 'Suspenso' | 'Arquivado' | 'Encerrado'
type PrioridadePrazo = 'Baixa' | 'Normal' | 'Alta' | 'Fatal'
type TipoCompromisso = 'Audiência' | 'Atendimento' | 'Reunião' | 'Prazo'
```

## AIOX Framework
O projeto usa Synkra AIOX v5.0.3 (`.aiox-core/`) para orquestração de agentes.
Agentes disponíveis: @dev, @qa, @architect, @pm, @po, @sm, @analyst, @data-engineer, @ux-design-expert, @devops
- **@devops** é o ÚNICO que pode fazer git push e criar PRs
- Stories ficam em `docs/stories/`

## Assets
- Logo: `frontend/images/logoAgile.png` — usado em Navbar, Login, MfaChallenge, DashboardLayout
- Favicon: `frontend/public/favicon.ico` (copiado de `frontend/images/logoAgile.ico`)

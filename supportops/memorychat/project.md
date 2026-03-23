---
name: SupportOps — Visão geral do projeto
type: project
date: 2026-03-23
---

## O que é

Painel web de suporte técnico automatizado chamado **SupportOps**.
Localização: `C:\Users\vinih\OneDrive\Área de Trabalho\teste\supportops`

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui (estilo `base-nova`)
- Zustand para estado global
- @hello-pangea/dnd para drag and drop
- @anthropic-ai/sdk para classificação de tickets
- Fonte: Geist Sans/Mono (arquivos locais em `app/fonts/`)

## Estrutura de arquivos relevantes

```
supportops/
├── app/
│   ├── page.tsx                     # Layout principal: Dashboard + Kanban
│   ├── layout.tsx                   # Fonte Geist, dark mode forçado
│   ├── globals.css                  # Design tokens Vercel-like
│   └── api/briefing/reload/route.ts # Hot reload do briefing.json
├── components/
│   ├── dashboard/Dashboard.tsx      # Painel esquerdo (resumo, prioridades, análise, scan)
│   ├── kanban/
│   │   ├── KanbanBoard.tsx          # DragDropContext principal
│   │   ├── KanbanColumn.tsx         # Colunas droppable
│   │   ├── TicketCard.tsx           # Cards draggable
│   │   └── KanbanTopBar.tsx         # Header do Kanban
│   └── modals/
│       ├── AssignModal.tsx          # Atribuir responsável
│       ├── LicenseModal.tsx         # Confirmação ao mover p/ "Liberar Licença"
│       └── ResolveModal.tsx         # Resposta sugerida ao resolver
├── store/supportops.ts              # Zustand store + 10 tickets mockados reais
├── types/index.ts                   # Tipos: Ticket, Briefing, KanbanColumn, etc.
├── lib/utils.ts                     # cn(), priorityLabel(), categoryLabel(), etc.
├── scripts/
│   ├── morning.mjs                  # Script de coleta + análise Claude API
│   └── test_ui.py                   # Testes Playwright (7/7 passando)
├── supportops-data/                 # briefing.json gerado pelo morning script
└── MORNING.md                       # Instruções para o comando /morning
```

## Fluxo /morning

1. Claude lê abas do Chrome (Academy + Zendesk) via extensão "Claude in Chrome"
2. Monta JSON raw em `supportops-data/input-raw.json`
3. Executa `node scripts/morning.mjs --input ./supportops-data/input-raw.json`
4. Script chama Claude API (`claude-opus-4-6`) para classificar + sugerir respostas
5. Salva `supportops-data/briefing.json`
6. Notifica app via `POST /api/briefing/reload`

```bash
npm run morning
# ou
node scripts/morning.mjs --input ./supportops-data/input-raw.json
```

## Colunas Kanban

| ID | Label | Comportamento especial |
|----|-------|----------------------|
| `triagem` | Triagem | — |
| `licenca` | Liberar Licença | Abre modal de confirmação |
| `bug_suporte` | Bug / Suporte | — |
| `faq` | FAQ | — |
| `resolvido` | Resolvido | Abre modal com sugestão de resposta |

## Categorias de ticket

`licenca` · `bug` · `faq` · `suporte` · `sugestao`

## Design system (Vercel-like, dark)

| Token | Valor |
|-------|-------|
| Background | `#0a0a0a` |
| Surface (cards) | `#111111` |
| Surface hover | `#161616` |
| Borda | `#1a1a1a` |
| Texto primário | `#ededed` |
| Texto secundário | `#737373` |
| Texto terciário | `#525252` |
| Urgente | `#ef4444` (ponto 6px) |
| Alta prioridade | `#737373` (ponto 6px) |

Sem badges coloridos, sem bordas laterais coloridas nos cards, sem gradientes.

## Como rodar

```bash
cd supportops
npm run dev        # http://localhost:3000
npm run build      # build de produção
npm run morning    # coleta + análise matinal
PYTHONIOENCODING=utf-8 python scripts/test_ui.py  # testes UI
```

## Dependência de ambiente

`ANTHROPIC_API_KEY` deve estar configurada para o script `morning.mjs` funcionar.
Copiar `.env.local.example` → `.env.local` e preencher a chave.

## Status

- [x] Projeto criado e funcionando
- [x] Dados mockados reais (10 tickets: Academy + Zendesk)
- [x] Drag and drop entre colunas
- [x] Modais de automação (Licença + Resolver)
- [x] Modal de atribuição
- [x] Script morning.mjs com integração Claude API
- [x] MORNING.md com instruções /morning
- [x] Testes Playwright (7/7)
- [x] Redesign Vercel-like aplicado
- [ ] Integração real com Chrome (depende do uso do /morning)

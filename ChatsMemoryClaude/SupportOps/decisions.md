---
name: SupportOps — Decisões técnicas e preferências
type: feedback
date: 2026-03-23
---

## Decisões de design

- **Referência visual**: Vercel Dashboard — dark sutil, profissional, respirado
- **Cor de acento única**: branco `#ffffff` para elementos ativos
- **Proibido**: teal, ciano, roxo neon, bordas coloridas em cards, badges com fundo colorido
- **Prioridade urgente**: apenas ponto vermelho `#ef4444` (6px), sem badge
- **Tipografia máxima no corpo**: `font-medium` (500) — `font-bold` só no logo
- **Fonte**: Geist Sans/Mono (arquivos locais do Next.js template)

## Decisões de arquitetura

- Dashboard e Kanban são **componentes separados** (`Dashboard.tsx` vs `KanbanBoard.tsx`)
  - Dashboard: painel esquerdo fixo com resumo, prioridades, análise, botão scan
  - Kanban: área direita com topbar própria (`KanbanTopBar.tsx`) + colunas

- **Tailwind v4** (não v3) — a shadcn CLI instalou `base-nova` style que requer v4
  - `postcss.config.mjs` usa `@tailwindcss/postcss` (não `tailwindcss`)
  - CSS tokens via `@theme inline {}` + `@layer base { :root {} }`
  - Não existe mais `tailwind.config.ts` com cores — tudo no CSS

- **shadcn estilo `base-nova`**: usa `@base-ui/react` (não Radix diretamente)
  - `TooltipTrigger` NÃO aceita `asChild` nessa versão
  - Componentes gerados com nova API `data-slot`, `render` em vez de `asChild`

- **Zustand store**: método `moveTicket` verifica se coluna destino é especial (licenca/resolvido) antes de mover — armazena `pendingMove` para o modal confirmar

- **Script morning**: ESM (`.mjs`) porque usa `import` — não adicionar `"type": "module"` ao `package.json` (quebraria o Next.js)

## Preferências do usuário

- Trabalha com suporte técnico diariamente
- Usa Chrome com Academy e Zendesk logados simultaneamente
- Usa extensão "Claude in Chrome" para leitura de abas
- Prefere validar etapa por etapa antes de continuar
- Gosta de dados mockados realistas (não lorem ipsum)
- Prefere design sóbrio e profissional — referência Vercel, não dashboards coloridos

## Comandos úteis descobertos

```bash
# Testar UI (rodar com servidor ativo na porta correta)
PYTHONIOENCODING=utf-8 python scripts/test_ui.py

# Se porta 3000 ocupada, Next.js sobe na 3001 automaticamente
npm run dev   # verificar no terminal qual porta foi usada

# Build limpo
npx next build

# TypeScript check
npx tsc --noEmit
```

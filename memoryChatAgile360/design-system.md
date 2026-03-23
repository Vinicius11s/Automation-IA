# Design System — Agile360 "Ouro Jurídico"

## Filosofia
"Bloomberg Terminal encontra escritório de advocacia de luxo."
Referências: Linear.app, Vercel, Stripe.
Sensação: acesso exclusivo, cofre bancário, controle total.

## Paleta de cores — Ouro Jurídico (APLICAR EM TUDO)

```css
/* Ouro */
--color-primary:       #C9A84C;   /* Ouro institucional */
--color-primary-dark:  #8B6914;   /* Ouro escuro */
--color-primary-hover: #E8C97A;   /* Ouro claro no hover */
--color-primary-light: #F5E6B8;   /* Ouro muito claro */
--color-primary-muted: rgba(201,168,76,0.12);

/* Fundos */
--color-background:    #0D0D0D;   /* Preto profundo */
--color-surface:       #000000;   /* Preto puro - cards */
--color-surface-elevated: #0d0d0d;

/* Bordas */
--color-border:        #1e293b;
--color-border-strong: #2d3f55;

/* Texto */
--color-text-heading:  #f1f5f9;
--color-text:          #cbd5e1;
--color-text-secondary:#94a3b8;
--color-text-muted:    #64748b;

/* Semânticas */
--color-error:         #f87171;
--color-success:       #34d399;
--color-warning:       #fbbf24;

/* Nav */
--color-nav-active-bg: rgba(201,168,76,0.10);
```

## Tipografia
- **UI:** Inter (todas as interfaces)
- **Display/Headlines:** Instrument Serif, italic — para títulos dramáticos
- **Mono:** JetBrains Mono — campos de código, inputs TOTP

### Uso do Instrument Serif
```tsx
// Saudação no dashboard, headline no login/mfa:
style={{
  fontFamily: 'var(--font-display)',
  fontStyle: 'italic',
  fontWeight: 400,
  fontSize: '1.875rem' // ou 2rem, 2.25rem
}}
```

## Efeitos visuais

### Grain overlay (todas as páginas auth)
```css
.grain { position: fixed; top: -50%; left: -50%; width: 200%; height: 200%;
  background-image: url("data:image/svg+xml,...feTurbulence..."); opacity: 0.025; }
```

### Gold shimmer button
```css
background: linear-gradient(110deg, #8B6914 0%, #C9A84C 30%, #F5E6B8 50%, #C9A84C 70%, #8B6914 100%);
background-size: 300% auto;
animation: shimmer 7s linear infinite;
```

### Ambient glow
```css
background: radial-gradient(ellipse, rgba(201,168,76,0.06) 0%, transparent 65%);
animation: breathe 8s ease-in-out infinite;
```

## Padrão de scoped CSS
- Landing: variáveis `--lp-*` em `.landing-page`
- Login: variáveis `--lg-*` em `.login-page`
- MFA: variáveis `--mfa-*` em `.mfa-page`
- Dashboard: variáveis globais em `index.css`

## Tipo de compromisso — cores no calendário
```
Audiência:   acento #C9A84C (ouro)
Atendimento: acento #64748b (slate)
Reunião:     acento #7c8fa8 (slate claro)
Prazo:       acento #f87171 (vermelho)
```

## Status de processo — dots
```
Ativo:     #C9A84C (ouro)
Suspenso:  #fbbf24 (âmbar)
Arquivado: #475569 (slate)
Encerrado: #64748b (slate muted)
```

## Prioridade de prazo — bordas
```
Fatal:  borda #7f1d1d + dot pulsante vermelho animate-ping
Alta:   borda #c2410c
Normal: borda var(--color-border)
Baixa:  borda var(--color-border)
```

## Componentes reutilizáveis já construídos

### useCountUp (DashboardHome.tsx)
```tsx
function useCountUp(target: number, duration = 900, active = true): number
// Anima de 0 → target com ease-out cúbico via requestAnimationFrame
```

### SectionLabel (DashboardHome.tsx)
Labels de seção com gradiente ouro bilateral nas linhas separadoras.

### Skeleton
```tsx
<div className="animate-pulse rounded-[var(--radius)]"
     style={{ backgroundColor: 'var(--color-border-strong)' }} />
```

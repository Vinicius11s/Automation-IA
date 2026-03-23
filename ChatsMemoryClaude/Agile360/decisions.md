# Decisões técnicas e de design — Agile360

## Decisões de arquitetura

### Roteamento auth sem Navbar
**Decisão:** `/login`, `/register`, `/forgot-password`, `/reset-password`, `/mfa-challenge`
foram removidos do `PublicLayout` (que tem Navbar) e ficam como routes diretas sem layout.
**Por quê:** Páginas auth são full-screen cinematográficas — Navbar quebraria o design.
**Como:** Em `App.tsx`, apenas `/` fica dentro do `<Route element={<PublicLayout />}>`.

### CSS scoped por página (não CSS Modules)
**Decisão:** Login, MFA e Landing usam classes BEM prefixadas (`.lg-*`, `.mfa-*`, `.lp-*`)
com variáveis CSS scoped ao elemento raiz da página.
**Por quê:** Evita conflitos sem adicionar build step de CSS Modules. Compatível com Tailwind.

### Inline styles para theming dinâmico
**Decisão:** Dashboard usa inline styles com `var(--color-*)` para tudo que muda com tema.
**Por quê:** shadcn/ui + Tailwind não suportam CSS variables dinâmicas facilmente.
Inline styles permitem dark/light toggle instantâneo sem re-render pesado.

### Logo como imagem (não SVG inline)
**Decisão:** `logoAgile.png` importado via `import logo from '../../images/logoAgile.png'`
**Por quê:** Arquivo PNG real da marca. Caminho: `frontend/images/logoAgile.png`.
Tamanhos usados: 28px (sidebar), 32px (Navbar), 40px (Login/MFA).

### Favicon .ico
**Decisão:** `frontend/public/favicon.ico` (copiado de `frontend/images/logoAgile.ico`)
`index.html` usa `<link rel="icon" type="image/x-icon" href="/favicon.ico" />`

## Decisões de design

### Paleta: Ouro Jurídico (#C9A84C)
**Decisão:** Substituiu laranja original (#D95F00) em TUDO — primary, nav-active, audiência, etc.
**Por quê:** Laranja é comum/agressivo para SaaS jurídico. Ouro transmite autoridade, luxo, exclusividade.
**Manteve:** Vermelho (#f87171) para urgência/erro, cores funcionais do calendário.

### 6 inputs individuais no MFA (não 1 input)
**Decisão:** Cada dígito do TOTP tem seu próprio `<input>` com auto-avance.
**Por quê:** Experiência premium — como cofre bancário. Feedback visual por dígito.
Suporta paste de 6 chars de uma vez (detectado no onChange por `clean.length > 1`).

### Instrument Serif italic para headlines
**Decisão:** Tipografia display em todas as páginas auth + saudação do dashboard.
**Por quê:** Autoridade editorial, diferencia de 100% dos SaaS jurídicos brasileiros.
Usado apenas em H1/headlines dramáticos — UI permanece Inter.

### Auto-submit no 6º dígito MFA
**Decisão:** `useEffect` que monitora `digits.every(d => d !== '')` e chama `submit(full)`.
**Por quê:** Reduz fricção — padrão do setor (Google, Authy, iCloud).

### useCountUp com requestAnimationFrame (não setInterval)
**Decisão:** rAF + ease-out cúbico para animar números no Dashboard.
**Por quê:** 60fps, não bloqueia JS thread, cancela corretamente no cleanup.

### Dot pulsante animate-ping nos prazos fatais
**Decisão:** Prazos com prioridade Fatal E dias <= 3 recebem dot vermelho com animate-ping.
**Por quê:** Urgência visual imediata — o advogado vê de relance o que precisa de atenção.

### Grupos na sidebar (não lista plana)
**Decisão:** Nav dividida em 3 grupos: [Painel, Aprovações] | [Gestão] | [Sistema].
**Por quê:** Hierarquia visual — separa ações de alto nível (Painel) de entidades (Gestão).

## Decisões de limpeza

### Pastas removidas do projeto
- `.gemini/` — Gemini CLI adapter, desabilitado em core-config
- `.cursor/` — Cursor IDE adapter, desabilitado
- `.antigravity/` — AI tool desconhecida, desabilitada
- `.aios-core/` — Framework AIOS v4.2.13 antigo, substituído por `.aiox-core/` v5.0.3
**Validação:** `core-config.yaml` confirmou que gemini/cursor estavam `false`.

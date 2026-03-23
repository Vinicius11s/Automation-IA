# /morning — SupportOps Morning Briefing

Este arquivo contém as instruções para o Claude Code executar o ritual de manhã do SupportOps.
Quando você rodar `/morning`, o Claude deve seguir estes passos na ordem exata.

---

## Objetivo

Coletar todos os tickets abertos do Academy e do Zendesk pelas abas do Chrome,
classificar automaticamente com IA, e salvar o briefing em `./supportops-data/briefing.json`.

---

## Passo 1 — Verificar o ambiente

```bash
cd supportops
```

Confirme que o app está rodando ou inicie-o:
```bash
npm run dev
```

---

## Passo 2 — Coletar tickets do Academy

1. Acesse a aba do Chrome onde o Academy está aberto e logado
2. Leia a lista de tickets/suporte visíveis na tela
3. Para cada ticket, extraia:
   - `raw_id`: ID ou número do ticket (ex: "#1234" ou "Ticket 1234")
   - `title`: título/assunto do ticket
   - `person`: nome do aluno/solicitante
   - `status`: status atual (aberto, pendente, etc.)
   - `raw_date`: data de abertura (converta para ISO se possível)
   - `raw_text`: primeiras linhas do conteúdo/descrição

4. Se houver paginação, navegue para ver todos os tickets abertos

---

## Passo 3 — Coletar tickets do Zendesk

1. Acesse a aba do Chrome onde o Zendesk está aberto e logado
2. Acesse a fila de tickets abertos (Views > All open tickets)
3. Para cada ticket, extraia:
   - `raw_id`: número do ticket Zendesk
   - `title`: assunto do ticket
   - `person`: nome do solicitante
   - `status`: status (new, open, pending, etc.)
   - `priority`: prioridade se visível (urgent, high, normal, low)
   - `raw_date`: data de criação
   - `raw_text`: primeira mensagem ou descrição do problema

---

## Passo 4 — Montar o JSON de input

Após coletar os dados, monte este JSON:

```json
{
  "academy": [
    {
      "raw_id": "AC-123",
      "title": "Não consigo acessar o módulo",
      "person": "Nome do Aluno",
      "status": "open",
      "raw_date": "2026-03-23T08:00:00",
      "raw_text": "Descrição do problema..."
    }
  ],
  "zendesk": [
    {
      "raw_id": "ZD-456",
      "title": "Solicito licença adicional",
      "person": "Nome do Cliente",
      "status": "open",
      "priority": "high",
      "raw_date": "2026-03-23T07:30:00",
      "raw_text": "Descrição do problema..."
    }
  ]
}
```

Salve em `./supportops-data/input-raw.json`

---

## Passo 5 — Executar o script de análise

```bash
node scripts/morning.js --input ./supportops-data/input-raw.json
```

> **Requisito**: `ANTHROPIC_API_KEY` deve estar configurada no ambiente.
> Configure com: `export ANTHROPIC_API_KEY=sk-ant-...`

O script irá:
1. Enviar os tickets para a API Claude para análise e classificação
2. Gerar sugestões de resposta para cada ticket
3. Calcular prioridades do dia
4. Salvar `./supportops-data/briefing.json`
5. Notificar o app via `POST /api/briefing/reload`

---

## Passo 6 — Verificar o resultado

```bash
cat ./supportops-data/briefing.json
```

O app em `http://localhost:3000` irá recarregar automaticamente com os novos dados.

---

## Estrutura do briefing.json gerado

```json
{
  "generated_at": "2026-03-23T09:00:00",
  "summary": {
    "total": 10,
    "urgent": 3,
    "academy": 5,
    "zendesk": 5,
    "pending_licenses": 2
  },
  "priorities": [
    "ZD-001: Descrição (4h aberto, urgente)",
    "AC-001: Descrição (3h aberto)",
    "AC-005: Descrição (risco de churn)"
  ],
  "claude_analysis": "Análise geral do dia...",
  "tickets": [...]
}
```

---

## Categorias utilizadas

| Categoria   | Quando usar |
|-------------|-------------|
| `licenca`   | Pedidos de acesso, liberação, ativação |
| `bug`       | Erros técnicos, problemas de sistema |
| `faq`       | Dúvidas com resposta padrão conhecida |
| `suporte`   | Atendimento que precisa de análise |
| `sugestao`  | Melhorias, feedbacks positivos |

## Colunas Kanban iniciais

Todos os tickets começam em **Triagem**. O agente move conforme análise:
- `triagem` → início (todos os tickets)
- `licenca` → tickets de liberação de acesso
- `bug_suporte` → erros e suporte técnico
- `faq` → dúvidas com resposta padrão
- `resolvido` → finalizados

---

## Troubleshooting

**Erro "ANTHROPIC_API_KEY não configurada":**
```bash
export ANTHROPIC_API_KEY=sua-chave-aqui
```

**Aba do Chrome não acessível:**
- Certifique-se que a extensão "Claude in Chrome" está ativa
- O site deve estar logado e com tickets visíveis na tela

**briefing.json já existente:**
- O script sobrescreve o arquivo anterior automaticamente
- O arquivo anterior não é preservado (faça backup se necessário)

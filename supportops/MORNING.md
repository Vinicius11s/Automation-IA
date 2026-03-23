# /morning — SupportOps Morning Briefing

Instruções para o Claude Code executar a coleta de tickets da Academy via extensão do Chrome.

---

## Objetivo

Coletar todos os tickets abertos da Academy, classificar com IA (OpenAI) e gravar no banco via `/api/collect`.

---

## Passo 1 — Verificar o ambiente

Confirme que o app está rodando em `http://localhost:3000`. Se não estiver:
```bash
cd D:\GitHub\Automation-IA\supportops && npm run dev
```

---

## Passo 2 — Coletar tickets da Academy

1. Acesse a aba do Chrome na URL:
   **https://academy.raioxpreditivo.com.br/dashboard/atendimento/suporte**

2. No **lado esquerdo** da tela estão listados todos os tickets abertos. Clique em cada um para abrir.

3. Com o ticket aberto, no **lado direito** da tela ficam os detalhes. Extraia os seguintes campos:

   | Campo no site       | Campo no JSON     | Observação                                      |
   |---------------------|-------------------|-------------------------------------------------|
   | Assunto             | `title`           | Título/assunto do ticket                        |
   | Última mensagem     | `description`     | Último texto enviado pelo aluno/lead            |
   | Plataforma          | `platform`        | Plataforma indicada no ticket                   |
   | Nome do aluno/lead  | `person`          | Nome completo do solicitante                    |
   | Aberto em           | `raw_date`        | Data de abertura, converter para ISO se possível|
   | Departamento        | `department_tag`  | Departamento do ticket                          |
   | ID do ticket        | `raw_id`          | **Somente números** — ex: `725295`              |

4. Repita para todos os tickets listados no lado esquerdo.

---

## Passo 3 — Salvar o JSON de input

Monte e salve em `./supportops-data/input-raw.json`:

```json
{
  "academy": [
    {
      "raw_id": "725295",
      "title": "Não consigo acessar o módulo",
      "description": "Última mensagem do aluno aqui...",
      "platform": "Web",
      "person": "Nome do Aluno",
      "raw_date": "2026-03-23T08:00:00",
      "department_tag": "Suporte"
    }
  ]
}
```

---

## Passo 4 — Executar o script

```bash
node D:\GitHub\Automation-IA\supportops\scripts\morning.mjs --input ./supportops-data/input-raw.json
```

O script irá:
1. Enviar os tickets para OpenAI para análise e classificação
2. Fazer upsert no banco via `POST http://localhost:3000/api/collect`
   - Novos tickets → inseridos na coluna **Triagem**
   - Tickets existentes não resolvidos → campos automáticos atualizados
   - Tickets resolvidos → ignorados

---

## Passo 5 — Verificar no app

Abra `http://localhost:3000/suporte/kanban` e clique no botão de atualizar (↻).

---

## Categorias

| Categoria   | Quando usar                              |
|-------------|------------------------------------------|
| `licenca`   | Pedidos de acesso, liberação, ativação   |
| `bug`       | Erros técnicos, problemas de sistema     |
| `faq`       | Dúvidas com resposta padrão conhecida    |
| `suporte`   | Atendimento que precisa de análise       |
| `sugestao`  | Melhorias, feedbacks positivos           |

---

## Troubleshooting

**App não está rodando:** execute `npm run dev` antes do script

**Aba do Chrome não acessível:** certifique-se que a extensão "Claude in Chrome" está ativa e a URL acima está aberta e logada

**Erro de autenticação OpenAI:** verifique `OPENAI_API_KEY` no `.env.local`

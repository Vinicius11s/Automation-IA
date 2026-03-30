# Gerenciar Compromisso — Sub-fluxo CRM

## Objetivo
Executar operações de cadastro, edição ou exclusão de compromisso no CRM.
Compromisso criado vai para staging (aguarda aprovação no painel).
Após aprovação, o CRM dispara webhook para o N8N criar o evento no Google Calendar.

---

## Entradas (payload recebido do fluxo principal)
```json
{
  "acao": "cadastrar | editar | excluir",
  "entidade": "compromisso",
  "id_advogado": "uuid do advogado",
  "mensagem": "mensagem original do usuário",
  "dados": {
    "tipo_compromisso": "audiência | reunião | consulta | despacho | ...",
    "data": "YYYY-MM-DD ou null",
    "hora": "HH:MM ou null",
    "tipo_audiencia": "texto ou null",
    "nome_cliente": "nome para resolver id_cliente, ou null",
    "numero_processo": "referência para resolver id_processo, ou null",
    "local": "texto ou null",
    "lembrete_minutos": "inteiro ou null",
    "observacoes": "texto ou null",
    "feedback_extratora": "null ou descrição de problemas"
  }
}
```

---

## Ferramentas / Scripts

1. `execution/crm_compromisso.py` — função principal `manage_compromisso(payload)`

---

## Fluxo Passo a Passo

### CADASTRAR
1. Validar campo obrigatório: `tipo_compromisso` deve estar presente
   - Ausente → retornar erro pedindo o tipo do compromisso
2. Resolver `nome_cliente` → `id_cliente` via Supabase (busca por nome_completo ILIKE)
   - Não encontrado → `id_cliente` = null (compromisso sem cliente vinculado)
3. Resolver `numero_processo` → `id_processo` via Supabase
   - Não encontrado → `id_processo` = null
4. Montar payload com `id_advogado` e campos resolvidos
5. Chamar `POST /api/compromisso/staging`
6. Retornar `{return: "sucesso"}` ou `{return: "erro"}`

### EDITAR / EXCLUIR
- Mesma lógica de resolução de FKs
- Chamar `PUT` ou `DELETE /api/compromisso/staging`

---

## Campos da tabela `compromisso`
```
tipo_compromisso (obrigatório), data, hora, id_advogado,
tipo_audiencia, id_cliente, id_processo,
observacoes, local, lembrete_minutos
```

---

## Saídas
- `{return: "sucesso"}` → enviado para staging com sucesso
- `{return: "Informe o tipo do compromisso..."}` → campo obrigatório ausente
- `{return: "erro"}` → erro na API CRM

---

## Edge Cases
- Advogado menciona cliente que não existe no banco → vincula sem cliente (`id_cliente` null)
- Data relativa ("amanhã", "próxima segunda") → resolvida pelo extrator com base na data atual
- `hora` não informada → null, advogado define depois no painel
- Google Calendar só é criado APÓS aprovação no painel (via webhook do CRM → N8N)

---

## Aprendizados
- `id_cliente` e `id_processo` são UUIDs — nunca enviar nomes para a API, sempre resolver primeiro
- Busca por cliente usa ILIKE para ser case-insensitive

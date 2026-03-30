# Assistente Jurídico — Fluxo Principal

## Objetivo
Receber mensagens de advogados via WhatsApp (Evolution API), identificar a intenção,
extrair dados e executar operações no CRM ou responder como assistente de conversa (Gabriela).

---

## Entradas
- `remote_jid`: identificador do número no WhatsApp (ex: `5518996251546@s.whatsapp.net`)
- `remote_jid_alt`: número limpo para busca no banco
- `message_type`: `conversation`, `extendedTextMessage`, `audioMessage`, `imageMessage`
- `message_text`: texto da mensagem (ou transcrição do áudio via Evolution)
- `message_timestamp`: timestamp unix da mensagem

---

## Ferramentas / Scripts (em ordem)

1. `execution/verify_lawyer.py` — verifica se o número existe na tabela `advogado` no Supabase
2. `execution/message_buffer.py` — acumula mensagem no Redis (debounce anti-spam)
3. `execution/classify_intent.py` — LLM classifica: `{acao, entidade, confianca, mensagem}`
4. `execution/extract_cliente.py` — se entidade=cliente, extrai campos do CRM
5. `execution/crm_cliente.py` — executa operação no CRM (cadastrar/editar/excluir)
6. `execution/assistente_gabriela.py` — gera resposta final em linguagem natural
7. `execution/send_whatsapp.py` — envia typing indicator + mensagem de resposta

---

## Fluxo Passo a Passo

1. Webhook recebe evento da Evolution API (`messages.upsert`)
2. Extrair `remoteJidAlt` (número limpo, sem `@s.whatsapp.net`)
3. Chamar `verify_lawyer(remote_jid_alt)` → se não encontrar, encerrar silenciosamente
4. Identificar tipo de mensagem:
   - `conversation` ou `extendedTextMessage` → usar `message.conversation`
   - `audioMessage` → usar `message.speechToText` (Evolution já transcreve)
   - `imageMessage` → ignorar (não implementado)
5. Chamar `message_buffer.push_and_debounce(session_id, text)`:
   - Retorna `True` se deve prosseguir (última mensagem da janela)
   - Retorna `False` se deve parar (outra mensagem chegou depois)
6. Se `False` → encerrar
7. Chamar `classify_intent(text, id_advogado)` → `{acao, entidade, mensagem}`
8. Se `acao == "conversa"` → pular para passo 11
9. Rotear por `entidade`:
   - `cliente` → `extract_cliente(mensagem)` → `crm_cliente(acao, id_advogado, dados)`
   - `compromisso` → (a implementar) `extract_compromisso` → `crm_compromisso`
   - `processo` → (a implementar) `extract_processo` → `crm_processo`
   - `prazo` → (a implementar) `extract_prazo` → `crm_prazo`
10. Receber `{feedback_acao, return}` do CRM
11. Chamar `assistente_gabriela(tipo, acao, entidade, feedback_acao, mensagem)` → texto de resposta
12. Chamar `send_whatsapp.send_typing(remote_jid)` → mostra "digitando..."
13. Chamar `send_whatsapp.send_messages(remote_jid, response_text)` → envia com delay entre parágrafos

---

## Saídas
- Mensagem de resposta enviada ao advogado via WhatsApp
- Log da operação realizada

---

## Edge Cases
- Advogado não encontrado no Supabase → encerrar sem responder
- Mensagem do tipo `imageMessage` → ignorar (não suportado)
- `confianca < 0.7` na classificação → tratar como "conversa"
- API do CRM retornar erro → Gabriela informa que "algo não saiu como esperado"
- Redis indisponível → logar erro e tentar prosseguir sem debounce

---

## Aprendizados
- O debounce do Redis usa LPUSH + espera + LRANGE + compara último item.
  Se o último item da lista == mensagem atual → é a última → prosseguir.
  Se diferente → outra mensagem chegou depois → parar esta execução.
- A Evolution API já transcreve áudio para texto no campo `speechToText`.
- Mensagens de resposta devem ser quebradas por `\n\n` e enviadas com delay de 1.2s entre elas.

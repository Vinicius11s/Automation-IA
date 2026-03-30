"""
webhook.py — Ponto de entrada da automação
Recebe eventos da Evolution API e orquestra o fluxo completo.

Iniciar: uvicorn webhook:app --host 0.0.0.0 --port 8000 --reload
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, BackgroundTasks, Request, HTTPException

from execution.verify_lawyer import verify_lawyer
from execution.message_buffer import push_and_debounce
from execution.conversation_history import save_message, load_history
from execution.classify_intent import classify_intent
from execution.extract_cliente import extract_cliente
from execution.crm_cliente import manage_client
from execution.extract_compromisso import extract_compromisso
from execution.crm_compromisso import manage_compromisso
from execution.assistente_gabriela import generate_response
from execution.send_whatsapp import send_messages

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Assistente Jurídico — webhook iniciado.")
    yield


app = FastAPI(title="Assistente Jurídico Agile360", lifespan=lifespan)


# ---------------------------------------------------------------------------
# Helpers de extração do payload Evolution API
# ---------------------------------------------------------------------------

def _extract_message_data(body: dict) -> dict | None:
    """
    Extrai os campos relevantes do payload da Evolution API.
    Retorna None se o evento não deve ser processado.
    """
    if body.get("event") != "messages.upsert":
        return None

    data = body.get("data", {})
    key = data.get("key", {})

    # Ignorar mensagens enviadas pelo próprio bot
    if key.get("fromMe"):
        return None

    message_type = data.get("messageType")
    message = data.get("message", {})

    # Extrair texto conforme tipo
    if message_type in ("conversation", "extendedTextMessage"):
        text = message.get("conversation") or message.get("extendedTextMessage", {}).get("text")
    elif message_type == "audioMessage":
        text = message.get("speechToText", "")
        # Evolution inclui prefixo "[audio]" na transcrição — remover antes de processar
        if text.lower().startswith("[audio]"):
            text = text[7:].strip()
    else:
        # imageMessage e outros não suportados
        log.info(f"Tipo de mensagem não suportado: {message_type}")
        return None

    if not text:
        return None

    remote_jid = key.get("remoteJid", "")
    remote_jid_alt = key.get("remoteJidAlt", remote_jid)
    # Limpa sufixos como @s.whatsapp.net ou @lid
    numero_limpo = remote_jid_alt.split("@")[0]

    return {
        "remote_jid": remote_jid,
        "numero_limpo": numero_limpo,
        "text": text,
        "message_type": message_type,
    }


# ---------------------------------------------------------------------------
# Processamento principal (roda em background)
# ---------------------------------------------------------------------------

async def process_message(remote_jid: str, numero_limpo: str, text: str):
    """
    Orquestra o fluxo completo de processamento de uma mensagem.
    Executa em background para responder ao webhook imediatamente.
    """
    log.info(f"[{numero_limpo}] Mensagem recebida: {text[:60]}...")

    # 1. Verificar advogado no Supabase
    advogado = verify_lawyer(numero_limpo)
    if not advogado:
        log.info(f"[{numero_limpo}] Número não encontrado — ignorando.")
        return

    id_advogado = advogado["id"]
    session_id = advogado.get("remoteJid", numero_limpo)
    log.info(f"[{numero_limpo}] Advogado identificado: {id_advogado}")

    # 2. Debounce Redis — acumula e aguarda janela de mensagens
    should_proceed, accumulated_text = push_and_debounce(session_id, text)
    if not should_proceed:
        log.info(f"[{numero_limpo}] Debounce: outra mensagem chegou depois — parando.")
        return

    log.info(f"[{numero_limpo}] Texto acumulado: {accumulated_text[:80]}...")

    # 3. Carregar histórico e salvar mensagem do usuário
    history = load_history(id_advogado, limit=5)
    save_message(id_advogado, "user", accumulated_text)
    log.info(f"[{numero_limpo}] Histórico carregado: {len(history)} mensagens.")

    # 4. Classificar intenção (com histórico para resolver referências contextuais)
    classificacao = classify_intent(accumulated_text, id_advogado, history=history)
    acao = classificacao.get("acao")
    entidade = classificacao.get("entidade")
    mensagem = classificacao.get("mensagem", accumulated_text)
    log.info(f"[{numero_limpo}] Classificado: acao={acao} entidade={entidade}")

    feedback_acao = None

    # 5. Processar ação no CRM (se não for conversa)
    if acao != "conversa" and entidade:
        if entidade == "cliente":
            dados_extraidos = extract_cliente(mensagem, history=history)
            feedback_extratora = dados_extraidos.pop("feedback_extratora", None)

            if feedback_extratora:
                feedback_acao = "dados_incompletos"
                log.info(f"[{numero_limpo}] Extração incompleta: {feedback_extratora}")
            else:
                resultado = manage_client(acao, id_advogado, dados_extraidos)
                feedback_acao = resultado.get("return", "erro")
                log.info(f"[{numero_limpo}] CRM resultado: {feedback_acao}")

        elif entidade == "compromisso":
            dados_extraidos = extract_compromisso(mensagem, history=history)
            feedback_extratora = dados_extraidos.pop("feedback_extratora", None)

            if feedback_extratora:
                feedback_acao = "dados_incompletos"
                log.info(f"[{numero_limpo}] Extração incompleta: {feedback_extratora}")
            else:
                resultado = manage_compromisso(acao, id_advogado, dados_extraidos)
                feedback_acao = resultado.get("return", "erro")
                log.info(f"[{numero_limpo}] CRM resultado: {feedback_acao}")

        else:
            log.info(f"[{numero_limpo}] Entidade '{entidade}' ainda não implementada.")
            feedback_acao = "erro"

    # 6. Gerar resposta da Gabriela
    if acao == "conversa":
        resposta = generate_response(tipo="conversa", mensagem=mensagem, history=history)
    else:
        resposta = generate_response(
            tipo="acao",
            acao=acao,
            entidade=entidade,
            feedback_acao=feedback_acao,
        )

    log.info(f"[{numero_limpo}] Resposta gerada: {resposta[:80]}...")

    # 7. Salvar resposta da Gabriela no histórico
    save_message(id_advogado, "assistant", resposta)

    # 8. Enviar resposta via Evolution API
    send_messages(remote_jid=remote_jid, response_text=resposta)
    log.info(f"[{numero_limpo}] Resposta enviada.")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.post("/webhook")
async def webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Recebe eventos da Evolution API.
    Responde 200 imediatamente e processa em background.
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="JSON inválido")

    msg_data = _extract_message_data(body)
    if not msg_data:
        return {"status": "ignored"}

    background_tasks.add_task(
        process_message,
        remote_jid=msg_data["remote_jid"],
        numero_limpo=msg_data["numero_limpo"],
        text=msg_data["text"],
    )

    return {"status": "accepted"}


@app.get("/health")
async def health():
    return {"status": "ok"}

"""
Script: send_whatsapp.py
Diretiva: directives/assistente_juridico.md
Descrição: Envia mensagens e indicador de digitação via Evolution API.
"""

import os
import time
import requests
from dotenv import load_dotenv

load_dotenv()

EVOLUTION_URL = os.getenv("EVOLUTION_API_URL")
EVOLUTION_KEY = os.getenv("EVOLUTION_API_KEY")
EVOLUTION_INSTANCE = os.getenv("EVOLUTION_INSTANCE")
MESSAGE_DELAY_SECONDS = 1.2


def _headers() -> dict:
    return {"apikey": EVOLUTION_KEY, "Content-Type": "application/json"}


def send_typing(remote_jid: str, delay_ms: int = 2000) -> None:
    """
    Envia indicador de 'digitando...' antes de enviar a mensagem.

    Args:
        remote_jid: número completo do destinatário (ex: '60073892159701@lid')
        delay_ms: duração do indicador em milissegundos
    """
    url = f"{EVOLUTION_URL}/chat/sendPresence/{EVOLUTION_INSTANCE}"
    payload = {
        "number": remote_jid,
        "delay": delay_ms,
        "presence": "composing",
    }
    requests.post(url, json=payload, headers=_headers(), timeout=10)


def split_messages(text: str) -> list[str]:
    """
    Quebra o texto em mensagens separadas por parágrafo duplo (\\n\\n).
    Remove mensagens vazias.
    """
    parts = text.split("\n\n")
    return [p.strip() for p in parts if p.strip()]


def send_text(remote_jid: str, text: str) -> None:
    """
    Envia uma única mensagem de texto.

    Args:
        remote_jid: número completo do destinatário
        text: conteúdo da mensagem
    """
    url = f"{EVOLUTION_URL}/message/sendText/{EVOLUTION_INSTANCE}"
    payload = {
        "number": remote_jid,
        "text": text,
    }
    response = requests.post(url, json=payload, headers=_headers(), timeout=10)
    response.raise_for_status()


def send_messages(remote_jid: str, response_text: str) -> None:
    """
    Envia resposta completa: typing indicator + mensagens com delay entre elas.

    Args:
        remote_jid: número completo do destinatário
        response_text: texto completo da resposta (parágrafos separados por \\n\\n)
    """
    messages = split_messages(response_text)

    send_typing(remote_jid)

    for i, message in enumerate(messages):
        send_text(remote_jid, message)
        if i < len(messages) - 1:
            time.sleep(MESSAGE_DELAY_SECONDS)


if __name__ == "__main__":
    # Teste local
    send_messages(
        remote_jid="5518996251546@s.whatsapp.net",
        response_text="Olá! Tudo bem?\n\nSeu cadastro foi realizado com sucesso.",
    )

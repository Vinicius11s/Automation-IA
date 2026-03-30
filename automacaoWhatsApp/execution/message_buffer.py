"""
Script: message_buffer.py
Diretiva: directives/assistente_juridico.md
Descrição: Gerencia o buffer de mensagens no Redis com lógica de debounce anti-spam.
           Garante que apenas a última mensagem de uma janela de tempo seja processada.
"""

import os
import time
import redis
from dotenv import load_dotenv

load_dotenv()

_redis: redis.Redis = None


def _get_client() -> redis.Redis:
    global _redis
    if _redis is None:
        _redis = redis.from_url(
            os.getenv("REDIS_URL", "redis://localhost:6379"),
            decode_responses=True,
        )
    return _redis


def push_message(session_id: str, message: str) -> int:
    """Adiciona mensagem ao final da lista no Redis. Retorna tamanho atual da lista."""
    r = _get_client()
    return r.rpush(session_id, message)


def get_messages(session_id: str) -> list[str]:
    """Retorna todas as mensagens acumuladas na lista."""
    r = _get_client()
    return r.lrange(session_id, 0, -1)


def delete_messages(session_id: str) -> None:
    """Remove a lista do Redis após processamento."""
    r = _get_client()
    r.delete(session_id)


def push_and_debounce(session_id: str, message: str) -> tuple[bool, str]:
    """
    Lógica completa de debounce:
    1. Adiciona a mensagem na lista
    2. Aguarda o intervalo configurado
    3. Verifica se esta mensagem ainda é a última da lista
    4. Se sim: acumula todas, limpa Redis e retorna (True, texto_acumulado)
    5. Se não: outra mensagem chegou depois, retorna (False, "")

    Args:
        session_id: identificador da sessão (remoteJid do advogado)
        message: texto da mensagem recebida

    Returns:
        (True, texto_acumulado) se deve prosseguir
        (False, "") se deve parar (outra mensagem chegou)
    """
    push_message(session_id, message)

    wait_seconds = float(os.getenv("REDIS_DEBOUNCE_SECONDS", "2.5"))
    time.sleep(wait_seconds)

    messages = get_messages(session_id)

    if not messages:
        return False, ""

    # Se a última mensagem da lista não é a mensagem atual, outra chegou depois
    if messages[-1] != message:
        return False, ""

    # É a última — acumula tudo e limpa
    accumulated_text = "\n".join(messages)
    delete_messages(session_id)

    return True, accumulated_text


if __name__ == "__main__":
    should_proceed, text = push_and_debounce("test_session", "Cadastre o cliente João Silva")
    print(f"Prosseguir: {should_proceed}")
    print(f"Texto: {text}")

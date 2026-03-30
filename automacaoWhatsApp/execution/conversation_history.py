"""
Script: conversation_history.py
Diretiva: directives/assistente_juridico.md
Descrição: Persiste e carrega histórico de conversa no Supabase (tabela `conversa`).
           Redis é apenas debounce temporário — histórico real vive aqui.
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

_supabase: Client = None


def _get_client() -> Client:
    global _supabase
    if _supabase is None:
        _supabase = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_KEY"),
        )
    return _supabase


def save_message(id_advogado: str, role: str, content: str) -> None:
    """
    Salva uma mensagem no histórico de conversa.

    Args:
        id_advogado: UUID do advogado
        role: "user" ou "assistant"
        content: texto da mensagem
    """
    _get_client().table("conversa").insert({
        "id_advogado": id_advogado,
        "role": role,
        "content": content,
    }).execute()


def load_history(id_advogado: str, limit: int = 5) -> list[dict]:
    """
    Carrega as últimas N mensagens do advogado, ordenadas da mais antiga para a mais recente.
    Retorna no formato esperado pela API da OpenAI.

    Args:
        id_advogado: UUID do advogado
        limit: número de mensagens a carregar (default 5)

    Returns:
        Lista de dicts: [{"role": "user"|"assistant", "content": "..."}]
    """
    response = (
        _get_client()
        .table("conversa")
        .select("role, content")
        .eq("id_advogado", id_advogado)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )

    # Inverte para ordem cronológica (mais antiga primeiro)
    messages = list(reversed(response.data))
    return [{"role": m["role"], "content": m["content"]} for m in messages]

"""
Script: verify_lawyer.py
Diretiva: directives/assistente_juridico.md
Descrição: Verifica se o número de WhatsApp pertence a um advogado cadastrado no Supabase.
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


def verify_lawyer(remote_jid_alt: str) -> dict | None:
    """
    Busca advogado na tabela `advogado` pelo número limpo (sem @s.whatsapp.net).

    Args:
        remote_jid_alt: número no formato '5518996251546'

    Returns:
        dict com dados do advogado (id, remoteJid, ...) ou None se não encontrado
    """
    supabase = _get_client()

    # Remove o sufixo caso venha com ele
    numero = remote_jid_alt.split("@")[0].split(":")[0]

    response = (
        supabase.table("advogado")
        .select("*")
        .eq("remoteJid", numero)
        .execute()
    )

    if response.data:
        return response.data[0]

    return None


if __name__ == "__main__":
    resultado = verify_lawyer("5518996251546")
    print(resultado)

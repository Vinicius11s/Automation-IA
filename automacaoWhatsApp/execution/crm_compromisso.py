"""
Script: crm_compromisso.py
Diretiva: directives/gerenciar_compromisso.md
Descrição: Executa operações de compromisso no CRM.
           Resolve nome_cliente e numero_processo para UUIDs antes de enviar à API.
"""

import os
import requests
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

_supabase: Client = None


def _get_supabase() -> Client:
    global _supabase
    if _supabase is None:
        _supabase = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_KEY"),
        )
    return _supabase


def _crm_headers(id_advogado: str) -> dict:
    return {
        "Content-Type": "application/json",
        "X-Master-Service-Key": os.getenv("CRM_MASTER_KEY"),
        "X-On-Behalf-Of": id_advogado,
    }


def _resolve_cliente(nome_cliente: str, id_advogado: str) -> str | None:
    """Resolve nome do cliente para UUID via Supabase."""
    if not nome_cliente:
        return None

    response = (
        _get_supabase()
        .table("cliente")
        .select("id")
        .eq("id_advogado", id_advogado)
        .ilike("nome_completo", f"%{nome_cliente}%")
        .limit(1)
        .execute()
    )
    return response.data[0]["id"] if response.data else None


def _resolve_processo(numero_processo: str, id_advogado: str) -> str | None:
    """Resolve referência de processo para UUID via Supabase."""
    if not numero_processo:
        return None

    response = (
        _get_supabase()
        .table("processo")
        .select("id")
        .eq("id_advogado", id_advogado)
        .ilike("numero", f"%{numero_processo}%")
        .limit(1)
        .execute()
    )
    return response.data[0]["id"] if response.data else None


def _call_crm(method: str, id_advogado: str, dados: dict) -> dict:
    base_url = os.getenv("CRM_API_URL")
    url = f"{base_url}/api/compromisso/staging"
    response = requests.request(
        method=method,
        url=url,
        json=dados,
        headers=_crm_headers(id_advogado),
        timeout=15,
    )
    response.raise_for_status()
    return response.json()


def manage_compromisso(acao: str, id_advogado: str, dados: dict) -> dict:
    """
    Gerencia operação de compromisso no CRM.

    Args:
        acao: "cadastrar" | "editar" | "excluir"
        id_advogado: UUID do advogado
        dados: campos extraídos pela LLM extratora

    Returns:
        {return: "sucesso" | mensagem de erro}
    """
    # 1. Validar campo obrigatório
    if not dados.get("tipo_compromisso"):
        return {"return": "Informe o tipo do compromisso (audiência, reunião, consulta, etc.) para continuar."}

    # 2. Resolver FKs — nome → UUID
    nome_cliente = dados.pop("nome_cliente", None)
    numero_processo = dados.pop("numero_processo", None)

    id_cliente = _resolve_cliente(nome_cliente, id_advogado)
    id_processo = _resolve_processo(numero_processo, id_advogado)

    if id_cliente:
        dados["id_cliente"] = id_cliente
    if id_processo:
        dados["id_processo"] = id_processo

    dados["id_advogado"] = id_advogado

    # 3. Chamar API CRM
    method_map = {"cadastrar": "POST", "editar": "PUT", "excluir": "DELETE"}
    method = method_map.get(acao)

    if not method:
        return {"return": "erro"}

    try:
        _call_crm(method, id_advogado, dados)
        return {"return": "sucesso"}

    except requests.HTTPError as e:
        print(f"[crm_compromisso] Erro HTTP: {e.response.status_code} — {e.response.text}")
        return {"return": "erro"}

    except Exception as e:
        print(f"[crm_compromisso] Erro inesperado: {e}")
        return {"return": "erro"}


if __name__ == "__main__":
    resultado = manage_compromisso(
        acao="cadastrar",
        id_advogado="36334b14-3dc6-4e7b-b8fc-230e2fb9eb42",
        dados={
            "tipo_compromisso": "audiência",
            "data": "2026-03-29",
            "hora": "14:00",
            "nome_cliente": "Maria Gabriela",
            "local": "fórum central",
        },
    )
    print(resultado)

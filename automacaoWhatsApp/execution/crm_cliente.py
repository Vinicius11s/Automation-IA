"""
Script: crm_cliente.py
Diretiva: directives/gerenciar_cliente.md
Descrição: Executa operações de cadastro, edição e exclusão de cliente no CRM.
           Inclui validação de CPF/CNPJ e verificação de duplicidade no Supabase.
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


# --- Validação de documento ---

def _clean_digits(value: str) -> str:
    """Remove tudo que não é dígito."""
    return "".join(c for c in str(value) if c.isdigit())


def validate_document(dados: dict) -> dict:
    """
    Valida CPF (11 dígitos) ou CNPJ (14 dígitos) nos dados extraídos.

    Returns:
        {valido: bool, tipo: 'cpf'|'cnpj'|None, documento: str|None, erro: str|None}
    """
    cpf = _clean_digits(dados.get("cpf") or "")
    cnpj = _clean_digits(dados.get("cnpj") or "")

    if cpf:
        if len(cpf) == 11:
            return {"valido": True, "tipo": "cpf", "documento": cpf, "erro": None}
        return {
            "valido": False,
            "tipo": "cpf",
            "documento": cpf,
            "erro": f"CPF inválido — deve ter 11 dígitos, recebido: {cpf} ({len(cpf)} dígitos).",
        }

    if cnpj:
        if len(cnpj) == 14:
            return {"valido": True, "tipo": "cnpj", "documento": cnpj, "erro": None}
        return {
            "valido": False,
            "tipo": "cnpj",
            "documento": cnpj,
            "erro": f"CNPJ inválido — deve ter 14 dígitos, recebido: {cnpj} ({len(cnpj)} dígitos).",
        }

    return {
        "valido": False,
        "tipo": None,
        "documento": None,
        "erro": "Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) para continuar.",
    }


# --- Consulta Supabase ---

def find_client(tipo: str, documento: str) -> dict | None:
    """
    Busca cliente no Supabase por CPF ou CNPJ.

    Returns:
        dict com dados do cliente ou None se não encontrado
    """
    supabase = _get_supabase()
    response = (
        supabase.table("cliente")
        .select("*")
        .eq(tipo, documento)
        .execute()
    )
    return response.data[0] if response.data else None


# --- Chamadas à API CRM ---

def _call_crm(method: str, id_advogado: str, dados: dict) -> dict:
    """Executa POST, PUT ou DELETE na API CRM."""
    base_url = os.getenv("CRM_API_URL")
    url = f"{base_url}/api/cliente/staging"

    response = requests.request(
        method=method,
        url=url,
        json=dados,
        headers=_crm_headers(id_advogado),
        timeout=15,
    )
    response.raise_for_status()
    return response.json()


# --- Função principal ---

def manage_client(acao: str, id_advogado: str, dados: dict) -> dict:
    """
    Gerencia operação de cliente no CRM com validações completas.

    Args:
        acao: "cadastrar" | "editar" | "excluir"
        id_advogado: UUID do advogado
        dados: campos extraídos pela LLM extratora

    Returns:
        {return: "sucesso" | "erro" | mensagem de validação}
    """
    # 1. Validar documento
    validacao = validate_document(dados)
    if not validacao["valido"]:
        return {"return": validacao["erro"]}

    tipo = validacao["tipo"]
    documento = validacao["documento"]

    # Normalizar o campo no dict de dados
    dados[tipo] = documento

    # 2. Verificar existência no Supabase
    cliente_existente = find_client(tipo, documento)

    try:
        if acao == "cadastrar":
            if cliente_existente:
                return {"return": "Cliente já cadastrado no sistema."}
            _call_crm("POST", id_advogado, dados)
            return {"return": "sucesso"}

        elif acao == "editar":
            if not cliente_existente:
                return {"return": "Nenhum registro encontrado para edição."}
            _call_crm("PUT", id_advogado, dados)
            return {"return": "sucesso"}

        elif acao == "excluir":
            if not cliente_existente:
                return {"return": "Nenhum registro encontrado para exclusão."}
            _call_crm("DELETE", id_advogado, dados)
            return {"return": "sucesso"}

        else:
            return {"return": "erro"}

    except requests.HTTPError as e:
        print(f"[crm_cliente] Erro HTTP: {e.response.status_code} — {e.response.text}")
        return {"return": "erro"}

    except Exception as e:
        print(f"[crm_cliente] Erro inesperado: {e}")
        return {"return": "erro"}


if __name__ == "__main__":
    resultado = manage_client(
        acao="cadastrar",
        id_advogado="36334b14-3dc6-4e7b-b8fc-230e2fb9eb42",
        dados={"nome_completo": "Alisson Almeida", "cpf": "12345678909"},
    )
    print(resultado)

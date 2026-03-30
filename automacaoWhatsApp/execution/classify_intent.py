"""
Script: classify_intent.py
Diretiva: directives/assistente_juridico.md
Descrição: LLM classificadora — identifica ação e entidade da mensagem do advogado.
           Retorna JSON estruturado com acao, entidade, confianca e mensagem original.
"""

import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

_client: OpenAI = None

SYSTEM_PROMPT = """Você é um classificador de intenção para um sistema jurídico.
Sua ÚNICA função é identificar a AÇÃO e a ENTIDADE da mensagem recebida
e retornar um JSON estruturado.

## REGRAS ABSOLUTAS
- Retorne EXCLUSIVAMENTE o JSON. Sem explicações, sem texto adicional,
  sem markdown, sem blocos de código.
- Você NÃO extrai dados da mensagem. Você NÃO preenche campos.
- Se a mensagem for ambígua ou não se encaixar em nenhuma opção,
  use acao: "conversa" e entidade: null.
- Nunca combine duas ações em uma só saída.

## VALORES PERMITIDOS

AÇÃO (escolha exatamente um):
- "cadastrar"   → criar novo registro (ex: "cadastre", "adicione", "registre", "inclua")
- "alterar"     → modificar registro existente (ex: "atualize", "mude", "edite", "corrija")
- "excluir"     → remover registro (ex: "delete", "remova", "exclua", "cancele")
- "conversa"    → qualquer outra intenção (dúvidas, saudações, pedidos fora do escopo)

ENTIDADE (escolha exatamente um ou null):
- "cliente"       → pessoa física ou jurídica
- "processo"      → processo jurídico ou caso
- "compromisso"   → reunião, audiência, evento agendado
- "prazo"         → deadline, data-limite, vencimento

## FORMATO DE SAÍDA OBRIGATÓRIO
{
  "acao": "<valor>",
  "entidade": "<valor ou null>",
  "confianca": <0.0 a 1.0>,
  "mensagem": "<mensagem original>"
}"""


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _client


def classify_intent(text: str, id_advogado: str, history: list = []) -> dict:
    """
    Classifica a intenção da mensagem do advogado.

    Args:
        text: texto acumulado das mensagens do advogado
        id_advogado: UUID do advogado (incluído no retorno)
        history: histórico de conversa no formato OpenAI [{role, content}]

    Returns:
        dict com {acao, entidade, id_advogado, confianca, mensagem}
    """
    client = _get_client()
    model = os.getenv("OPENAI_MODEL_CLASSIFIER", "gpt-4.1-mini")

    response = client.chat.completions.create(
        model=model,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            *history,
            {"role": "user", "content": text},
        ],
    )

    result = json.loads(response.choices[0].message.content)
    result["id_advogado"] = id_advogado

    # Fallback de segurança: confiança baixa vira conversa
    if result.get("confianca", 1.0) < 0.7:
        result["acao"] = "conversa"
        result["entidade"] = None

    return result


if __name__ == "__main__":
    resultado = classify_intent(
        text="Poderia cadastrar o cliente Alisson Almeida?",
        id_advogado="36334b14-3dc6-4e7b-b8fc-230e2fb9eb42",
    )
    print(json.dumps(resultado, indent=2, ensure_ascii=False))

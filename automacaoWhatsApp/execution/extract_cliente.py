"""
Script: extract_cliente.py
Diretiva: directives/gerenciar_cliente.md
Descrição: LLM extratora — lê a mensagem e preenche os campos do cliente no CRM.
           Retorna apenas os campos mencionados explicitamente. Nada inventado.
"""

import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

_client: OpenAI = None

SYSTEM_PROMPT = """Você é um extrator de dados para um sistema jurídico.
Sua ÚNICA função é ler a mensagem do usuário e preencher
os campos do modelo abaixo, sem inventar nenhuma informação.

## CAMPOS DISPONÍVEIS
cpf, cnpj, rg, orgao_expedidor, inscricao_estadual,
nome_completo, razao_social, tipo_cliente,
email, telefone, whatsapp_numero,
cep, estado, cidade, endereco, numero, bairro, complemento,
data_referencia, estado_civil, area_atuacao,
numero_conta, pix, observacoes

## REGRAS ABSOLUTAS
- Retorne EXCLUSIVAMENTE um JSON com os campos encontrados na mensagem. Sem explicações.
- Preencha APENAS os campos que a mensagem menciona explicitamente.
- Campos não mencionados na mensagem NÃO devem aparecer no JSON (omita-os).
- Nunca corrija ou interprete dados — grave exatamente o que o usuário disse.
- Se um dado for ambíguo ou incompleto, omita o campo e registre no feedback.
- Campos numéricos (cpf, cnpj, rg, telefone, whatsapp_numero, cep, numero_conta)
  devem ter APENAS dígitos. Remova pontos, traços, barras e parênteses.
  Exemplo: "222.999.999-45" → "22299999945"
  Exemplo: "(11) 98888-7777" → "11988887777"

## REGRA DO feedback_extratora
- Se tudo foi extraído sem problemas: "feedback_extratora": null
- Se algum campo mencionado ficou fora por ser inválido/ambíguo:
  descreva o campo, o valor recebido e o motivo.
- Campos simplesmente não mencionados NÃO geram feedback.

## FORMATO DE SAÍDA
{
  "<campo>": "<valor>",
  ...,
  "feedback_extratora": null | "descrição dos problemas"
}

## EXEMPLOS

Mensagem: "Cadastre o cliente Chico Moedas, CPF 222.999.999-45"
Saída:
{
  "nome_completo": "Chico Moedas",
  "cpf": "22299999945",
  "feedback_extratora": null
}

Mensagem: "Cadastre o cliente João, telefone 9999, CPF 9876573581"
Saída:
{
  "nome_completo": "João",
  "feedback_extratora": "Telefone não gravado — número incompleto (9999). CPF não gravado — incompleto (9876573581), deve ter 11 dígitos."
}"""


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _client


def extract_cliente(mensagem: str, history: list = []) -> dict:
    """
    Extrai campos do cliente a partir da mensagem do advogado.

    Args:
        mensagem: texto da mensagem (já classificada como ação de cliente)
        history: histórico de conversa para completar campos de mensagens anteriores

    Returns:
        dict com campos preenchidos + feedback_extratora
    """
    client = _get_client()
    model = os.getenv("OPENAI_MODEL_EXTRACTOR", "gpt-3.5-turbo")

    response = client.chat.completions.create(
        model=model,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            *history,
            {"role": "user", "content": mensagem},
        ],
    )

    return json.loads(response.choices[0].message.content)


if __name__ == "__main__":
    resultado = extract_cliente("Cadastre o cliente Alisson Almeida, CPF 123.456.789-09")
    print(json.dumps(resultado, indent=2, ensure_ascii=False))

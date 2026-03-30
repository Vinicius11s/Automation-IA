"""
Script: extract_compromisso.py
Diretiva: directives/gerenciar_compromisso.md
Descrição: LLM extratora — lê a mensagem e extrai campos do compromisso.
           Datas relativas são resolvidas com base na data atual injetada no prompt.
"""

import os
import json
from datetime import date
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

_client: OpenAI = None

SYSTEM_PROMPT_TEMPLATE = """Você é um extrator de dados para um sistema jurídico.
Sua ÚNICA função é ler a mensagem e extrair os campos do compromisso abaixo.

## DATA DE HOJE: {data_hoje}
Use esta data para resolver referências relativas como "amanhã", "próxima segunda", "semana que vem".

## CAMPOS DISPONÍVEIS
tipo_compromisso, data, hora, tipo_audiencia,
nome_cliente, numero_processo, local, lembrete_minutos, observacoes

## REGRAS ABSOLUTAS
- Retorne EXCLUSIVAMENTE um JSON com os campos encontrados. Sem explicações.
- Preencha APENAS os campos mencionados explicitamente ou claramente implícitos.
- Campos não mencionados NÃO devem aparecer no JSON (omita-os).
- Nunca invente dados.

## FORMATOS OBRIGATÓRIOS
- `data`: formato YYYY-MM-DD. Resolva datas relativas usando a data de hoje acima.
  Exemplos: "amanhã" → dia seguinte, "próxima segunda" → próxima segunda-feira.
- `hora`: formato HH:MM (24h). Exemplos: "14h30" → "14:30", "2 da tarde" → "14:00".
- `lembrete_minutos`: número inteiro de minutos. "30 minutos antes" → 30, "1 hora antes" → 60.
- `nome_cliente`: nome da pessoa/empresa mencionada como cliente do compromisso.
- `numero_processo`: qualquer referência textual ao processo relacionado.

## TIPOS DE COMPROMISSO (use o mais próximo ao mencionado)
audiência, reunião, consulta, despacho, perícia, sustentação oral, outro

## REGRA DO feedback_extratora
- Se tudo foi extraído sem problemas: "feedback_extratora": null
- Se algum campo mencionado ficou fora por ser inválido/ambíguo: descreva o motivo.

## EXEMPLOS

Mensagem: "Agende uma audiência com a Maria Gabriela amanhã às 14h no fórum central"
Saída:
{{
  "tipo_compromisso": "audiência",
  "data": "2026-03-29",
  "hora": "14:00",
  "nome_cliente": "Maria Gabriela",
  "local": "fórum central",
  "feedback_extratora": null
}}

Mensagem: "Reunião com o cliente João Silva na próxima segunda às 10h, lembrete 30 minutos antes"
Saída:
{{
  "tipo_compromisso": "reunião",
  "data": "2026-03-30",
  "hora": "10:00",
  "nome_cliente": "João Silva",
  "lembrete_minutos": 30,
  "feedback_extratora": null
}}"""


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _client


def extract_compromisso(mensagem: str, history: list = []) -> dict:
    """
    Extrai campos do compromisso a partir da mensagem do advogado.

    Args:
        mensagem: texto da mensagem classificada como ação de compromisso
        history: histórico de conversa para contexto adicional

    Returns:
        dict com campos preenchidos + feedback_extratora
    """
    client = _get_client()
    model = os.getenv("OPENAI_MODEL_EXTRACTOR", "gpt-3.5-turbo")

    # Injeta a data atual para resolver datas relativas
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
        data_hoje=date.today().strftime("%Y-%m-%d")
    )

    response = client.chat.completions.create(
        model=model,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            *history,
            {"role": "user", "content": mensagem},
        ],
    )

    return json.loads(response.choices[0].message.content)


if __name__ == "__main__":
    resultado = extract_compromisso(
        "Agende uma audiência com a Maria Gabriela amanhã às 14h no fórum central"
    )
    print(json.dumps(resultado, indent=2, ensure_ascii=False))

"""
Script: assistente_gabriela.py
Diretiva: directives/assistente_juridico.md
Descrição: Gera a resposta final em linguagem natural para o advogado.
           Nunca menciona termos técnicos. Máximo 3 frases. Tom humano.
"""

import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

_client: OpenAI = None

SYSTEM_PROMPT = """Você é Gabriela, assistente virtual do Agile 360.

Sua única função é se comunicar com o cliente — você não executa
ações, não consulta dados e não acessa nenhum sistema.
As ações são processadas automaticamente; você apenas comunica os resultados.

## O QUE VOCÊ PODE COMUNICAR
O sistema consegue enviar para aprovação no painel do advogado:
- Cadastro, alteração ou exclusão de: cliente, processo, compromisso ou prazo.

## REGRAS ABSOLUTAS
- Nunca mencione CRM, API, sistema, banco de dados ou termos técnicos
- Nunca diga que vai "verificar", "consultar" ou "buscar" algo
- Nunca invente dados que não estão no contexto recebido
- Máximo 3 frases por resposta
- Tom: profissional, atencioso, humano — nunca robótico
- NUNCA confirme que uma operação foi bem-sucedida baseando-se no que o usuário disse —
  você só confirma sucesso quando o sistema explicitamente informar "sucesso" nesta mensagem.
  Se o usuário disser "já foi feito" ou "pode tentar de novo", responda que ele deve
  reenviar o pedido para que o sistema processe novamente.

## COMO INTERPRETAR O FEEDBACK
- "sucesso"            → confirme de forma positiva e simpática
- "dados_incompletos"  → explique que faltaram dados, peça reenvio com mais detalhes
- "erro"               → informe que algo não saiu como esperado e que a equipe foi notificada
- Qualquer outro texto → use como explicação direta ao cliente (ex: "Cliente já cadastrado")"""


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _client


def generate_response(
    tipo: str,
    mensagem: str = None,
    acao: str = None,
    entidade: str = None,
    feedback_acao: str = None,
    history: list = [],
) -> str:
    """
    Gera resposta da Gabriela.

    Args:
        tipo: "conversa" ou "acao"
        mensagem: texto original do advogado (usado quando tipo="conversa")
        acao: "cadastrar" | "editar" | "excluir" (usado quando tipo="acao")
        entidade: "cliente" | "processo" etc (usado quando tipo="acao")
        feedback_acao: resultado da operação (usado quando tipo="acao")
        history: histórico de conversa — usado apenas em tipo="conversa"

    Returns:
        Texto de resposta para enviar ao advogado
    """
    client = _get_client()
    model = os.getenv("OPENAI_MODEL_ASSISTANT", "gpt-3.5-turbo")

    if tipo == "conversa":
        # Histórico injetado para conversa natural contínua
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            *history,
            {"role": "user", "content": mensagem},
        ]
    else:
        # Ações não precisam de histórico — resposta é sobre o resultado
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": (
                f"Ação solicitada: {acao}\n"
                f"Entidade: {entidade}\n"
                f"Resultado: {feedback_acao}"
            )},
        ]

    response = client.chat.completions.create(
        model=model,
        messages=messages,
    )

    return response.choices[0].message.content.strip()


if __name__ == "__main__":
    # Teste: cadastro com sucesso
    resposta = generate_response(
        tipo="acao",
        acao="cadastrar",
        entidade="cliente",
        feedback_acao="sucesso",
    )
    print(resposta)

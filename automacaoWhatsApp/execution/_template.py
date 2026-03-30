"""
Script: [nome_do_script.py]
Diretiva: directives/[nome_da_diretiva.md]
Descrição: O que este script faz em 1 linha.
"""

import os
from dotenv import load_dotenv

# Carrega variáveis do .env
load_dotenv()

# --- Constantes ---
# API_KEY = os.getenv("MINHA_API_KEY")


def main(entrada: str) -> dict:
    """
    Função principal do script.

    Args:
        entrada: descreva o parâmetro

    Returns:
        dict com os resultados
    """
    resultado = {}

    # TODO: implementar lógica aqui

    return resultado


if __name__ == "__main__":
    # Exemplo de execução direta para testes
    resultado = main(entrada="valor_de_teste")
    print(resultado)

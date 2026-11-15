import os
from datetime import datetime, timezone
from pathlib import Path

import psycopg
from dotenv import load_dotenv

PASTA_PROJETO = Path(__file__).resolve().parent

# Preserva a referência ao SQLite para a migração do histórico.
CAMINHO_BANCO = PASTA_PROJETO / "meteorologia.db"

# Variáveis já configuradas no ambiente têm prioridade sobre o .env.
load_dotenv(PASTA_PROJETO / ".env", interpolate=False)


def conectar():
    url = os.getenv("DATABASE_URL")

    if not url:
        raise RuntimeError("DATABASE_URL nao foi configurada.")

    return psycopg.connect(
        url,
        sslmode="require",
        connect_timeout=10
    )


def criar_tabela():
    # A tabela já foi criada no Supabase.
    # Mantém o nome usado pelo receptor e verifica sua estrutura.
    with conectar() as conexao:
        conexao.execute("""
            SELECT id, estacao_id, recebido_em,
                   temperatura_c, umidade_pct, simulado,
                   luminosidade_adc, pressao_hpa,
                   gas_adc, chuva_adc
            FROM public.leituras
            LIMIT 0
        """)


def salvar_leitura(dados):
    recebido_em = datetime.now(timezone.utc)

    with conectar() as conexao:
        cursor = conexao.execute("""
            INSERT INTO public.leituras (
                estacao_id,
                recebido_em,
                temperatura_c,
                umidade_pct,
                simulado,
                luminosidade_adc,
                pressao_hpa,
                gas_adc,
                chuva_adc
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            dados["estacao_id"],
            recebido_em,
            dados["temperatura_c"],
            dados["umidade_pct"],
            dados["simulado"],
            dados.get("luminosidade_adc"),
            dados.get("pressao_hpa"),
            dados.get("gas_adc"),
            dados.get("chuva_adc")
        ))

        id_leitura = cursor.fetchone()[0]

    # Ao sair do bloco acima, a transação foi confirmada.
    return id_leitura

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from psycopg.rows import dict_row
from banco import conectar, criar_tabela

from fastapi.middleware.cors import CORSMiddleware

@asynccontextmanager
async def ciclo_de_vida(app):
    # Garante que a tabela existe ao iniciar a API.
    criar_tabela()
    yield


app = FastAPI(
    title="Estacao Meteorologica Virtual",
    lifespan=ciclo_de_vida
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://dashboard-orcin-psi-au03mdpn20.vercel.app",
    ],
    allow_methods=["GET"],
    allow_headers=["*"]
)


def consultar(sql, parametros=()):
    with conectar() as conexao:
        with conexao.cursor(row_factory=dict_row) as cursor:
            cursor.execute(sql, parametros)
            return cursor.fetchall()

    try:
        registros = conexao.execute(sql, parametros).fetchall()

        resultado = []

        for registro in registros:
            leitura = dict(registro)
            leitura["simulado"] = bool(leitura["simulado"])
            resultado.append(leitura)

        return resultado

    finally:
        conexao.close()


@app.get("/")
def inicio():
    return {
        "projeto": "Estacao meteorologica virtual",
        "origem_dados": "simulacao",
        "documentacao": "/docs"
    }


@app.get("/leituras/ultima")
def ultima_leitura():
    registros = consultar("""
        SELECT id, estacao_id, recebido_em, temperatura_c, umidade_pct, simulado, luminosidade_adc, pressao_hpa, gas_adc, chuva_adc
        FROM public.leituras
        ORDER BY id DESC
        LIMIT 1
    """)

    if not registros:
        raise HTTPException(
            status_code=404,
            detail="Nenhuma leitura registrada."
        )

    return registros[0]


@app.get("/leituras")
def historico(limite: int = Query(default=100, ge=1, le=1000)):
    registros = consultar("""
        SELECT id, estacao_id, recebido_em,
               temperatura_c, umidade_pct, simulado,
               luminosidade_adc, pressao_hpa, gas_adc, chuva_adc
        FROM public.leituras
        ORDER BY id DESC
        LIMIT %s
    """, (limite,))

    # Apresenta as leituras selecionadas da mais antiga à mais recente.
    return list(reversed(registros))
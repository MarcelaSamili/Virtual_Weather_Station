import json
import math
import psycopg
import paho.mqtt.client as mqtt

from banco import criar_tabela, salvar_leitura
#BROKER = "test.mosquitto.org"
BROKER = "broker.hivemq.com"
TOPICO = "pd2/estacao/7c9e42b1/leituras"


def validar_leitura(dados):
    if not isinstance(dados, dict):
        raise ValueError("A mensagem deve ser um objeto JSON.")

    if dados.get("estacao_id") != "estacao_virtual_01":
        raise ValueError("Estacao desconhecida.")

    if dados.get("simulado") is not True:
        raise ValueError("Esta estacao deve enviar dados simulados.")
    

    limites = {
        "temperatura_c": (-40, 80),
        "umidade_pct": (0, 100),
        "pressao_hpa": (300, 1100)
    }

    for campo, (minimo, maximo) in limites.items():
        valor = dados.get(campo)

        # Rejeita textos, booleanos, valores ausentes e não finitos.
        if type(valor) not in (int, float):
            raise ValueError(f"{campo}: deve ser numerico.")

        if not math.isfinite(valor) or not minimo <= valor <= maximo:
            raise ValueError(f"{campo}: fora dos limites.")
    
    
    
    # Exige uma leitura inteira do ADC, entre 0 e 4095.
    luminosidade = dados.get("luminosidade_adc")

    if type(luminosidade) is not int:
        raise ValueError("luminosidade_adc: deve ser um inteiro.")

    if not 0 <= luminosidade <= 4095:
        raise ValueError("luminosidade_adc: fora dos limites.")
    
    # Exige uma leitura inteira do MQ2, entre 0 e 4095.
    gas = dados.get("gas_adc")

    if type(gas) is not int:
        raise ValueError("gas_adc: deve ser um inteiro.")

    if not 0 <= gas <= 4095:
        raise ValueError("gas_adc: fora dos limites.")
    
    # Valida o sinal de chuva simulado pelo potenciômetro.
    chuva = dados.get("chuva_adc")

    if type(chuva) is not int:
        raise ValueError("chuva_adc: deve ser um inteiro.")

    if not 0 <= chuva <= 4095:
        raise ValueError("chuva_adc: fora dos limites.")


def ao_conectar(cliente, dados_usuario, flags, codigo, propriedades):
    if codigo == 0:
        print("Inscricao:", repr(BROKER), repr(TOPICO), flush=True)
        cliente.subscribe(TOPICO)
        print("Conectado ao broker. Aguardando leituras...")
    else:
        print("Conexao recusada:", codigo)


def ao_receber(cliente, dados_usuario, mensagem):
    print("Mensagem recebida no topico:", mensagem.topic, flush=True)

    try:
        dados = json.loads(mensagem.payload.decode("utf-8"))
        validar_leitura(dados)
    except ValueError as erro:
        print("Mensagem rejeitada:", erro)
        return

    try:
        id_leitura = salvar_leitura(dados)
    except psycopg.Error as erro:
        print("Falha ao salvar no Supabase:", type(erro).__name__)
        print("Codigo SQLSTATE:", erro.sqlstate or "indisponivel")
        return

    print(
        f"Salvo #{id_leitura} | "
        f"Temperatura: {dados['temperatura_c']:.1f} C | "
        f"Umidade: {dados['umidade_pct']:.1f} % | "
        f"Luminosidade ADC: {dados['luminosidade_adc']} | "
        f"Pressao: {dados['pressao_hpa']:.2f} hPa | "
        f"Gas MQ2 ADC: {dados['gas_adc']} | "
        f"Chuva ADC: {dados['chuva_adc']}",
        flush=True,
    )

def ao_inscrever(cliente, dados_usuario, mid, codigos, propriedades):
    print("Resposta da inscricao:", codigos)

if __name__ == "__main__":
    criar_tabela()

    cliente = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    cliente.on_connect = ao_conectar
    cliente.on_subscribe = ao_inscrever
    cliente.on_message = ao_receber
    try:
        cliente.connect(BROKER, 1883, 60)
        cliente.loop_forever()

    except KeyboardInterrupt:
        print("\nReceptor encerrado.")

    except OSError as erro:
        print("Falha de conexao:", erro)

    finally:
        cliente.disconnect()
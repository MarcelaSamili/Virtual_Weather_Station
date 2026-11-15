import { useEffect, useState } from 'react';
import './App.css';
import Graficos from './Graficos';
import Estatisticas from './Estatisticas';
import Localizacao from './Localizacao';
type Leitura = {
  id: number;
  estacao_id: string;
  recebido_em: string;
  temperatura_c: number;
  umidade_pct: number;
  luminosidade_adc: number | null;
  simulado: boolean;
  pressao_hpa: number | null;
  gas_adc: number | null;
  chuva_adc: number | null;
};
export default function App() {
  const [leituras, setLeituras] = useState<Leitura[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    const controlador = new AbortController();
    let ativo = true;
    let timer: ReturnType<typeof setTimeout>;

    async function carregar() {
      try {
        const resposta = await fetch(
          //'http://127.0.0.1:8000/leituras?limite=100',
          `${
            import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
          }/leituras?limite=100`,
          { signal: controlador.signal }
        );

        if (!resposta.ok) {
          throw new Error(`API retornou HTTP ${resposta.status}.`);
        }

        const dados: Leitura[] = await resposta.json();

        if (ativo) {
          setLeituras(dados);
          setErro('');
        }
      } catch (falha) {
        if (ativo) {
          setErro(
            falha instanceof Error
              ? falha.message
              : 'Não foi possível consultar a API.'
          );
        }
      } finally {
        if (ativo) {
          setCarregando(false);
          setAgora(Date.now());
          timer = setTimeout(carregar, 5000);
        }
      }
    }

    carregar();

    return () => {
      ativo = false;
      controlador.abort();
      clearTimeout(timer);
    };
  }, []);

  // Seleciona o registro de maior ID, independentemente da ordem da lista.
  const ultima = leituras.reduce<Leitura | undefined>(
    (maisRecente, leitura) =>
      !maisRecente || leitura.id > maisRecente.id ? leitura : maisRecente,
    undefined
  );

  const recente =
    ultima && agora - new Date(ultima.recebido_em).getTime() <= 15000;

  return (
    <main className="dashboard">
      <header>
        <p className="etiqueta">PROJETO E DESENVOLVIMENTO II</p>
        <h1>Estação meteorológica virtual</h1>
        <p>Monitoramento ambiental com dados simulados.</p>
      </header>

      {erro && (
        <p role="alert" className="aviso">
          Falha na consulta: {erro} Os dados exibidos podem estar antigos.
        </p>
      )}

      {carregando ? (
        <p role="status">Carregando leituras...</p>
      ) : ultima ? (
        <>
          <p className="status">
            {erro
              ? 'API indisponível'
              : recente
              ? 'Leitura recente'
              : 'Sem leitura recente'}
            {' · '}Registro #{ultima.id}
            {' · '}Último recebimento:{' '}
            {new Date(ultima.recebido_em).toLocaleString('pt-BR')}
          </p>

          <section className="indicadores" aria-label="Última leitura">
            <article className="card">
              <h2>Temperatura</h2>
              <p className="valor">
                {ultima.temperatura_c.toFixed(1)} <span>°C</span>
              </p>
            </article>

            <article className="card">
              <h2>Umidade relativa</h2>
              <p className="valor">
                {ultima.umidade_pct.toFixed(1)} <span>%</span>
              </p>
            </article>

            <article className="card">
              <h2>Luminosidade — ADC bruto</h2>
              <p className="valor">{ultima.luminosidade_adc ?? '—'}</p>
              <p>Escala de 0 a 4095; maior valor indica menos luz.</p>
            </article>

            <article className="card">
              <h2>Pressão atmosférica</h2>
              <p className="valor">
                {ultima.pressao_hpa?.toFixed(2) ?? '—'} <span>hPa</span>
              </p>
            </article>

            <article className="card">
              <h2>Gás MQ2 — ADC bruto</h2>
              <p className="valor">{ultima.gas_adc ?? '—'}</p>
              <p>Leitura simulada de 0 a 4095, sem conversão para ppm.</p>
            </article>

            <article className="card">
              <h2>Chuva simulada — ADC bruto</h2>
              <p className="valor">{ultima.chuva_adc ?? '—'}</p>
              <p>Sinal de teste por potenciômetro, de 0 a 4095.</p>
            </article>
          </section>

          <Graficos leituras={leituras} />
          <Estatisticas leituras={leituras} />
          <Localizacao />

          <section className="historico">
            <h2>Últimas 10 leituras</h2>

            <div className="tabela-container">
              <table>
                <caption>
                  Leituras simuladas; horários de recebimento no seu fuso local.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Registro</th>
                    <th scope="col">Horário</th>
                    <th scope="col">Temperatura</th>
                    <th scope="col">Umidade</th>
                    <th scope="col">Luminosidade (ADC)</th>
                    <th scope="col">Pressão (hPa)</th>
                    <th scope="col">Gás MQ2 (ADC)</th>
                    <th scope="col">Chuva simulada (ADC)</th>
                  </tr>
                </thead>
                <tbody>
                  {[...leituras]
                    .sort((a, b) => b.id - a.id)
                    .slice(0, 10)
                    .map(leitura => (
                      <tr key={leitura.id}>
                        <td>#{leitura.id}</td>
                        <td>
                          {new Date(leitura.recebido_em).toLocaleString(
                            'pt-BR'
                          )}
                        </td>
                        <td>{leitura.temperatura_c.toFixed(1)} °C</td>
                        <td>{leitura.umidade_pct.toFixed(1)} %</td>
                        <td>{leitura.luminosidade_adc ?? '—'}</td>
                        <td>{leitura.pressao_hpa?.toFixed(2) ?? '—'}</td>
                        <td>{leitura.gas_adc ?? '—'}</td>
                        <td>{leitura.chuva_adc ?? '—'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <p>Nenhuma leitura disponível. Inicie o receptor e a simulação.</p>
      )}
    </main>
  );
}

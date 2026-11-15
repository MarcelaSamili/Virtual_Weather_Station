import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type LeituraGrafico = {
  id: number;
  recebido_em: string;
  temperatura_c: number;
  umidade_pct: number;
  luminosidade_adc: number | null;
  pressao_hpa: number | null;
  gas_adc: number | null;
  chuva_adc: number | null;
};

type Props = {
  leituras: LeituraGrafico[];
};

export default function Graficos({ leituras }: Props) {
  // Prepara e ordena as leituras por horário de recebimento.
  const ordenadas = [...leituras]
    .map(leitura => ({
      ...leitura,
      instante: Date.parse(leitura.recebido_em),
    }))
    .filter(leitura => Number.isFinite(leitura.instante))
    .sort((a, b) => a.instante - b.instante || a.id - b.id);

  // Exibe os 10 minutos anteriores à última leitura disponível.
  const ultimoInstante = ordenadas[ordenadas.length - 1]?.instante;

  const dados =
    ultimoInstante === undefined
      ? []
      : ordenadas.filter(
          leitura => leitura.instante >= ultimoInstante - 10 * 60 * 1000
        );
  const indicadores = [
    {
      campo: 'temperatura_c',
      titulo: 'Temperatura',
      unidade: '°C',
      cor: '#0369a1',
    },
    {
      campo: 'umidade_pct',
      titulo: 'Umidade relativa',
      unidade: '%',
      cor: '#047857',
    },
    {
      campo: 'luminosidade_adc',
      titulo: 'Luminosidade',
      unidade: 'ADC bruto',
      cor: '#b45309',
    },
    {
      campo: 'pressao_hpa',
      titulo: 'Pressão atmosférica',
      unidade: 'hPa',
      cor: '#7c3aed',
    },
    {
      campo: 'gas_adc',
      titulo: 'Gás MQ2',
      unidade: 'ADC bruto',
      cor: '#be123c',
    },
    {
      campo: 'chuva_adc',
      titulo: 'Chuva simulada',
      unidade: 'ADC bruto',
      cor: '#0e7490',
    },
  ] as const;
  return (
    <section className="graficos" aria-label="Evolução das leituras">
      <p className="periodo-graficos">
        Até 100 leituras, nos 10 minutos anteriores à última medição disponível.
      </p>
      {indicadores.map(indicador => (
        <article className="grafico-card" key={indicador.campo}>
          <h2>
            {indicador.titulo} ({indicador.unidade})
          </h2>

          <p>
            {indicador.campo === 'luminosidade_adc'
              ? 'Dados simulados · maior valor indica menos luz'
              : indicador.campo === 'gas_adc'
              ? 'Dados simulados · leitura bruta, sem conversão para ppm'
              : indicador.campo === 'chuva_adc'
              ? 'Sinal simulado por potenciômetro · sem conversão para mm'
              : 'Dados simulados · horário de recebimento'}
          </p>

          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={dados}
              accessibilityLayer
              margin={{ top: 10, right: 20, bottom: 10, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                dataKey="instante"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                tickFormatter={valor =>
                  new Date(Number(valor)).toLocaleTimeString('pt-BR')
                }
                minTickGap={40}
              />

              <YAxis
                domain={
                  indicador.campo === 'umidade_pct'
                    ? [0, 100]
                    : indicador.campo === 'luminosidade_adc' ||
                      indicador.campo === 'gas_adc' ||
                      indicador.campo === 'chuva_adc'
                    ? [0, 4095]
                    : indicador.campo === 'pressao_hpa'
                    ? [300, 1100]
                    : ['auto', 'auto']
                }
                width={55}
              />

              <Tooltip
                labelFormatter={valor =>
                  new Date(Number(valor)).toLocaleString('pt-BR')
                }
              />

              <Line
                type="linear"
                dataKey={indicador.campo}
                name={indicador.titulo}
                unit={` ${indicador.unidade}`}
                stroke={indicador.cor}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </article>
      ))}
    </section>
  );
}

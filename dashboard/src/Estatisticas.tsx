type LeituraEstatistica = {
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
  leituras: LeituraEstatistica[];
};

const indicadores = [
  { campo: 'temperatura_c', titulo: 'Temperatura', unidade: '°C' },
  { campo: 'umidade_pct', titulo: 'Umidade relativa', unidade: '%' },
  { campo: 'luminosidade_adc', titulo: 'Luminosidade', unidade: 'ADC' },
  { campo: 'pressao_hpa', titulo: 'Pressão atmosférica', unidade: 'hPa' },
  { campo: 'gas_adc', titulo: 'Gás MQ2', unidade: 'ADC' },
  { campo: 'chuva_adc', titulo: 'Chuva simulada', unidade: 'ADC' },
] as const;

function formatar(valor: number | null) {
  return valor === null
    ? '—'
    : valor.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
}

export default function Estatisticas({ leituras }: Props) {
  // Usa a mesma janela temporal dos gráficos.
  const ordenadas = [...leituras]
    .map(leitura => ({
      ...leitura,
      instante: Date.parse(leitura.recebido_em),
    }))
    .filter(leitura => Number.isFinite(leitura.instante))
    .sort((a, b) => a.instante - b.instante || a.id - b.id);

  const ultimoInstante = ordenadas[ordenadas.length - 1]?.instante;

  const dados =
    ultimoInstante === undefined
      ? []
      : ordenadas.filter(
          leitura => leitura.instante >= ultimoInstante - 10 * 60 * 1000
        );

  const estatisticas = indicadores.map(indicador => {
    // Ignora valores ausentes e inválidos, preservando o zero.
    const valores = dados
      .map(leitura => leitura[indicador.campo])
      .filter(
        (valor): valor is number =>
          typeof valor === 'number' && Number.isFinite(valor)
      );

    const quantidade = valores.length;

    return {
      ...indicador,
      quantidade,
      media:
        quantidade > 0
          ? valores.reduce((soma, valor) => soma + valor, 0) / quantidade
          : null,
      minimo: quantidade > 0 ? Math.min(...valores) : null,
      maximo: quantidade > 0 ? Math.max(...valores) : null,
    };
  });

  return (
    <section className="historico" aria-labelledby="titulo-estatisticas">
      <h2 id="titulo-estatisticas">Estatísticas das leituras</h2>

      <div className="tabela-container">
        <table>
          <caption>
            Até 100 leituras nos 10 minutos anteriores à última leitura
            disponível. Valores ausentes são ignorados. Gás, luminosidade e
            chuva representam sinais em ADC bruto.
          </caption>

          <thead>
            <tr>
              <th scope="col">Indicador</th>
              <th scope="col">Unidade</th>
              <th scope="col">Leituras válidas</th>
              <th scope="col">Média</th>
              <th scope="col">Mínimo</th>
              <th scope="col">Máximo</th>
            </tr>
          </thead>

          <tbody>
            {estatisticas.map(item => (
              <tr key={item.campo}>
                <th scope="row">{item.titulo}</th>
                <td>{item.unidade}</td>
                <td>{item.quantidade}</td>
                <td>{formatar(item.media)}</td>
                <td>{formatar(item.minimo)}</td>
                <td>{formatar(item.maximo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

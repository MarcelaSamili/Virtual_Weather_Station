const LATITUDE = -21.187689105273357;
const LONGITUDE = -48.149456290771255;

export default function Localizacao() {
  const mapaUrl =
    `https://www.openstreetmap.org/export/embed.html` +
    `?bbox=${LONGITUDE - 0.005},${LATITUDE - 0.003},` +
    `${LONGITUDE + 0.005},${LATITUDE + 0.003}` +
    `&layer=mapnik&marker=${LATITUDE},${LONGITUDE}`;

  const linkMapa =
    `https://www.openstreetmap.org/` +
    `?mlat=${LATITUDE}&mlon=${LONGITUDE}` +
    `#map=17/${LATITUDE}/${LONGITUDE}`;

  const pontoA = { x: 0, y: 0 };
  const pontoB = { x: 300, y: 400 };

  const distancia = Math.hypot(pontoB.x - pontoA.x, pontoB.y - pontoA.y);

  return (
    <section className="historico" aria-labelledby="titulo-localizacao">
      <h2 id="titulo-localizacao">Localização de referência</h2>

      <p>Praça Faruh Ahmed Saleh — Barrinha, SP.</p>

      <p>
        Localização ilustrativa de uma estação virtual. As leituras são
        simuladas e não representam o clima real deste local.
      </p>

      <p>
        Latitude: {LATITUDE.toFixed(6)} · Longitude: {LONGITUDE.toFixed(6)}
      </p>

      <iframe
        title="Mapa da localização de referência da estação virtual em Barrinha"
        src={mapaUrl}
        className="mapa"
        loading="lazy"
      />

      <p>
        <a href={linkMapa} target="_blank" rel="noopener noreferrer">
          Abrir localização no OpenStreetMap (nova aba)
        </a>
      </p>

      <h3>Geometria analítica — plano local ilustrativo</h3>

      <p>
        Adotamos a estação como origem A = (0, 0), com o eixo X apontando para
        leste e o eixo Y para norte. As coordenadas deste exercício são
        expressas em metros.
      </p>

      <p>
        O ponto de teste B = (300, 400) representa um deslocamento de 300 metros
        a leste e 400 metros ao norte da origem.
      </p>

      <p>
        Distância: √(300² + 400²) ={' '}
        <strong>{distancia.toLocaleString('pt-BR')} metros</strong>.
      </p>

      <figure className="plano-local">
        <svg
          viewBox="0 0 460 460"
          role="img"
          aria-labelledby="titulo-plano descricao-plano"
        >
          <title id="titulo-plano">Distância entre a estação e o ponto B</title>
          <desc id="descricao-plano">
            Plano ilustrativo em metros, com escalas iguais nos dois eixos. A
            estação está em A, na origem. O ponto B está 300 metros a leste e
            400 metros ao norte. A distância entre eles é 500 metros.
          </desc>

          {/* Mesma escala: cada metro corresponde a 0,8 unidade do SVG. */}
          <line x1="60" y1="390" x2="410" y2="390" stroke="#475569" />
          <line x1="60" y1="390" x2="60" y2="30" stroke="#475569" />

          <text x="405" y="420" textAnchor="end">
            X — leste (m)
          </text>
          <text x="65" y="20">
            Y — norte (m)
          </text>

          <polyline
            points="60,390 300,390 300,70"
            fill="none"
            stroke="#64748b"
            strokeDasharray="6 4"
          />

          <line
            x1="60"
            y1="390"
            x2="300"
            y2="70"
            stroke="#0369a1"
            strokeWidth="3"
          />

          <circle cx="60" cy="390" r="6" fill="#0369a1" />
          <circle cx="300" cy="70" r="6" fill="#047857" />

          <text x="72" y="375">
            A (0, 0)
          </text>
          <text x="312" y="65">
            B (300, 400)
          </text>
          <text x="180" y="415" textAnchor="middle">
            300 m
          </text>
          <text x="310" y="240">
            400 m
          </text>
          <text x="130" y="220" fill="#0369a1">
            500 m
          </text>
        </svg>

        <figcaption>
          Deslocamentos ilustrativos: 300 m a leste e 400 m ao norte. O segmento
          AB mede 500 m.
        </figcaption>
      </figure>

      <p>
        Exemplo didático com deslocamentos definidos para o exercício. Latitude
        e longitude são coordenadas angulares e não foram usadas diretamente
        como metros neste cálculo.
      </p>
    </section>
  );
}

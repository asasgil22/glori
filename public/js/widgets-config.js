const ICONES_WIDGET = {
  sem: { label: "Sem icone" },
  grafico: { label: "Grafico" },
  fogo: { label: "Fogo / destaque" },
  estrela: { label: "Estrela" },
  bola: { label: "Bola / esporte" },
  trofeu: { label: "Trofeu" },
  enquete: { label: "Enquete" },
  megafone: { label: "Megafone" },
  raio: { label: "Raio / urgente" },
  relogio: { label: "Relogio / agenda" },
  lista: { label: "Lista" },
  play: { label: "Play / Vídeo" },
  twitter: { label: "Twitter / X" },
};

const LAYOUTS_WIDGET = {
  maisLidas: {
    lista: { label: "Lista numerada", desc: "Ranking com numero e detalhes." },
    compacto: {
      label: "Lista compacta",
      desc: "Titulos menores, menos espaco.",
    },
    cards: { label: "Cards", desc: "Cada materia em um bloco separado." },
  },
  jogos: {
    cards: { label: "Cards", desc: "Placar em blocos empilhados." },
    linha: { label: "Linha", desc: "Times e placar em uma linha." },
    tabela: { label: "Tabela", desc: "Visual tabular compacto." },
  },
  enquete: {
    barras: {
      label: "Barras de progresso",
      desc: "Percentual visual por opcao.",
    },
    classic: { label: "Botoes classicos", desc: "Opcoes simples sem barra." },
    minimal: { label: "Minimal", desc: "Lista enxuta com percentual." },
  },
  tabela: {
    completo: { label: "Tabela Completa", desc: "Exibe os 20 times." },
    resumido: { label: "Top 10", desc: "Apenas a parte superior da tabela." },
  },
  odds: {
    cards: { label: "Cards Modernos", desc: "Cards com 3 colunas de cotação." },
    lista: { label: "Lista Limpa", desc: "Texto corrido minimalista." },
  },
  videos: {
    carrossel: { label: "Carrossel", desc: "Vídeos em formato de carrossel." },
    lista: { label: "Lista", desc: "Vídeos empilhados." },
  },
  portais: {
    lista: { label: "Lista Limpa", desc: "Links com ícones." },
  },
  twitter: {
    cards: { label: "Cards", desc: "Estilo feed social nativo." },
    lista: { label: "Lista Compacta", desc: "Apenas textos rápidos." },
  },
};

const WIDGET_PADROES = {
  maisLidas: {
    titulo: "Mais lidas",
    subtitulo: "As materias com maior audiencia",
    icone: "grafico",
    layout: "lista",
  },
  jogos: {
    titulo: "Agenda de jogos",
    subtitulo: "Proximos confrontos e placares",
    icone: "bola",
    layout: "cards",
  },
  enquete: {
    titulo: "Enquete",
    subtitulo: "Participe da pesquisa do portal",
    icone: "enquete",
    layout: "barras",
  },
  tabela: {
    titulo: "Brasileirão",
    subtitulo: "Classificação atualizada",
    icone: "trofeu",
    layout: "completo",
  },
  odds: {
    titulo: "Odds da Partida",
    subtitulo: "Mercado de Apostas",
    icone: "fogo",
    layout: "cards",
  },
  videos: {
    titulo: "Últimos Vídeos",
    subtitulo: "Acompanhe nosso canal",
    icone: "play",
    layout: "carrossel",
  },
  portais: {
    titulo: "Últimas dos Portais",
    subtitulo: "Notícias de outras fontes",
    icone: "lista",
    layout: "lista",
  },
  twitter: {
    titulo: "Comunidade Alvinegra",
    subtitulo: "O que estão falando no X",
    icone: "twitter",
    layout: "cards",
  },
};

function normalizarWidgetsConfig(home = {}) {
  const entrada = home.widgets || {};
  const widgets = {};

  Object.keys(WIDGET_PADROES).forEach((chave) => {
    const padrao = WIDGET_PADROES[chave];
    const atual = entrada[chave] || {};
    widgets[chave] = {
      titulo: atual.titulo || padrao.titulo,
      subtitulo: atual.subtitulo || padrao.subtitulo,
      icone: ICONES_WIDGET[atual.icone] ? atual.icone : padrao.icone,
      layout: LAYOUTS_WIDGET[chave]?.[atual.layout]
        ? atual.layout
        : padrao.layout,
    };
  });

  return widgets;
}

function iconeWidgetSvg(tipo) {
  const icones = {
    grafico:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5M10 19V9M16 19V12M22 19V3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    fogo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c1 3 3 4.5 3 7.5a3 3 0 1 1-6 0c0-2 1.5-4.5 3-7.5Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 14c0 2 1.5 4 3 4s3-2 3-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    estrela:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.4 5.8 6.3.5-4.8 4 1.8 6.1L12 17l-5.7 3.4 1.8-6.1-4.8-4 6.3-.5L12 3Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    bola: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3c2 3 2 6 0 9M12 21c-2-3-2-6 0-9M3 12h18" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    trofeu:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5h8v3a4 4 0 0 1-8 0V5ZM6 5H4v2a3 3 0 0 0 3 3M18 5h2v2a3 3 0 0 1-3 3M9 18h6M12 14v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    enquete:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16V8M12 18V6M18 14V10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    megafone:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h4l5 4V6L8 10H4ZM15 8a4 4 0 0 1 0 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    raio: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 3 5 14h6l-1 7 8-12h-6l1-6Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    relogio:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    lista:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h12M9 12h12M9 18h12M5 6h.01M5 12h.01M5 18h.01" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>',
    twitter:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1 2.25h3.437l5.021 6.661L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117l12.006 15.644z" fill="currentColor"/></svg>',
  };
  return icones[tipo] || icones.grafico;
}

function htmlIconeWidget(tipo) {
  if (!tipo || tipo === "sem") return "";
  return `<span class="widget-card__icon">${iconeWidgetSvg(tipo)}</span>`;
}

function aplicarConfigWidgets(config = {}) {
  const widgets = normalizarWidgetsConfig(config.home || {});
  const mapaReverso = {
    maisLidas: "mais-lidas",
    jogos: "jogos",
    enquete: "enquete",
    tabela: "tabela",
    odds: "odds",
    videos: "videos",
    portais: "portais",
  };

  const padraoOrdem = [
    "maisLidas",
    "jogos",
    "enquete",
    "tabela",
    "odds",
    "videos",
    "portais",
  ];

  let ordem =
    Array.isArray(config.home?.ordemWidgets) &&
    config.home.ordemWidgets.length > 0
      ? config.home.ordemWidgets
      : padraoOrdem;

  ordem = [...new Set([...ordem, ...padraoOrdem])].filter((w) =>
    padraoOrdem.includes(w),
  );

  const sidebar = document.querySelector(".widgets-stack");

  ordem.forEach((chave) => {
    const dataWidget = mapaReverso[chave];
    const card = document.querySelector(`[data-widget="${dataWidget}"]`);
    if (!card) return;
    const cfg = widgets[chave];
    const head = card.querySelector(".widget-card__head");
    if (!head) return;

    const iconeHtml = htmlIconeWidget(cfg.icone);
    head.innerHTML = `
      ${iconeHtml}
      <div>
        <h2>${escapeHtmlWidget(cfg.titulo)}</h2>
        <p>${escapeHtmlWidget(cfg.subtitulo)}</p>
      </div>
    `;

    const isHidden = card.classList.contains("d-none") ? " d-none" : "";
    card.className = `widget-card widget-card--${dataWidget.replaceAll("-", "")} widget-card--layout-${cfg.layout}${isHidden}`;
    card.dataset.widgetLayout = cfg.layout;

    if (sidebar) {
      sidebar.appendChild(card);
    }
  });
}

function escapeHtmlWidget(valor = "") {
  return String(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

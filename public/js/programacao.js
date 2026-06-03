document.addEventListener("DOMContentLoaded", async () => {
  try {
    const resposta = await fetch("/api/config");
    const config = await resposta.json();
    if (typeof aplicarTemaPortal === "function") aplicarTemaPortal(config);
    if (typeof renderizarMarca === "function")
      renderizarMarca(config, document.getElementById("brand-link"));
    if (typeof aplicarMetaSeo === "function") {
      aplicarMetaSeo({
        title: `Programação | ${config.nomePortal || "Portal"}`,
        description:
          "Grade de horários dos principais canais do Botafogo no YouTube.",
        canonical: window.location.href,
      });
    }
  } catch (e) {
    console.warn("Erro ao carregar configs globais", e);
  }

  renderizarGrade();
});

const CANAIS = {
  tf: {
    nome: "Canal do TF",
    arroba: "@CanaldoTFoficial",
    cor: "#111111",
    icone: "TF",
    logo: "/uploads/logo-tf.png",
    link: "https://www.youtube.com/@CanaldoTFoficial/live",
  },
  setor: {
    nome: "Setor Visitante",
    arroba: "@SetorVisitante",
    cor: "#0f766e",
    icone: "SV",
    logo: "/uploads/logo-setor.png",
    link: "https://www.youtube.com/@SetorVisitante/live",
  },
  arena: {
    nome: "Arena Alvinegra",
    arroba: "@Arena.Alvinegra",
    cor: "#f70068",
    icone: "AA",
    logo: "/uploads/logo-arena.png",
    link: "https://www.youtube.com/@Arena.Alvinegra/live",
  },
};

let PROGRAMACAO = [];

function obterDiaAtual() {
  const dias = [
    "domingo",
    "segunda",
    "terca",
    "quarta",
    "quinta",
    "sexta",
    "sabado",
  ];
  return dias[new Date().getDay()];
}

async function renderizarGrade() {
  const tabsContainer = document.getElementById("diasTab");
  const contentContainer = document.getElementById("diasTabContent");
  const diaAtualId = obterDiaAtual();

  tabsContainer.innerHTML =
    '<div class="spinner-border text-secondary" role="status"></div>';

  try {
    const resposta = await fetch("/api/programacao?t=" + Date.now(), {
      cache: "no-store",
    });
    PROGRAMACAO = await resposta.json();
  } catch (error) {
    console.error("Erro ao carregar programação:", error);
  }

  if (!document.getElementById("style-grade-tabs")) {
    const style = document.createElement("style");
    style.id = "style-grade-tabs";
    style.innerHTML = `
      .grade-tab-btn { background: transparent !important; color: var(--ink) !important; opacity: 0.6; font-weight: 500; transition: all 0.3s ease; font-size: 0.9rem; border: none; }
      .grade-tab-btn:hover { opacity: 0.8; }
      .grade-tab-btn.active { background: var(--ink, #111) !important; color: var(--surface, #fff) !important; opacity: 1 !important; font-weight: 700 !important; box-shadow: 0 .125rem .25rem rgba(0,0,0,.075) !important; }
    `;
    document.head.appendChild(style);
  }

  let tabsHtml = "";
  let contentHtml = "";

  PROGRAMACAO.forEach((diaInfo) => {
    const isAtivo = diaInfo.id === diaAtualId;

    tabsHtml += `
      <li class="nav-item" role="presentation">
        <button class="nav-link grade-tab-btn ${isAtivo ? "active" : ""} rounded-pill px-3 px-md-4" id="tab-${diaInfo.id}" data-bs-toggle="pill" data-bs-target="#pane-${diaInfo.id}" type="button" role="tab">${diaInfo.dia}</button>
      </li>
    `;

    contentHtml += `
      <div class="tab-pane fade ${isAtivo ? "show active" : ""}" id="pane-${diaInfo.id}" role="tabpanel" tabindex="0">
        <div class="d-flex flex-column gap-3 mt-4">${renderizarEventos(diaInfo.eventos, isAtivo)}</div>
      </div>
    `;
  });

  tabsContainer.innerHTML = tabsHtml;
  contentContainer.innerHTML = contentHtml;
}

function renderizarEventos(eventos, isHoje) {
  if (!eventos || eventos.length === 0)
    return `<div class="text-center text-muted p-5 rounded-4" style="background: var(--surface-muted); border: 1px solid var(--line);">Nenhuma programação cadastrada.</div>`;
  const agora = new Date();
  const horaAtual = agora.getHours() * 60 + agora.getMinutes();

  // Garante que a ordem visual na página pública seja sempre cronológica
  const eventosOrdenados = [...eventos].sort((a, b) =>
    a.horario.localeCompare(b.horario),
  );

  return eventosOrdenados
    .map((evento) => {
      const canal = CANAIS[evento.canal];
      const [h, m] = evento.horario.split(":").map(Number);
      const horaEvento = h * 60 + m;
      const duracaoMinutos = 120; // Tempo que a tag "Ao Vivo" ficará acesa (2 horas)

      const isAoVivo =
        isHoje &&
        horaAtual >= horaEvento &&
        horaAtual < horaEvento + duracaoMinutos;
      const isEncerrado = isHoje && horaAtual >= horaEvento + duracaoMinutos;

      const aoVivoBadge = isAoVivo
        ? `<span class="badge bg-danger rounded-pill pulse-live d-flex align-items-center gap-1 shadow-sm px-2 py-1"><span class="live-dot bg-white rounded-circle" style="width: 5px; height: 5px;"></span> AO VIVO</span>`
        : `<span class="badge text-muted rounded-pill px-2 py-1 fw-bold" style="background: var(--surface-muted); border: 1px solid var(--line);">${isEncerrado ? "Encerrado" : "Agendado"}</span>`;
      const cardClass = isAoVivo
        ? `border-danger shadow`
        : `border-secondary border-opacity-10 shadow-sm`;

      return `
      <div class="p-3 p-md-4 rounded-4 d-flex align-items-center gap-3 gap-md-4 position-relative overflow-hidden ${cardClass}" style="background: var(--surface, #fff); border: 1px solid var(--line); transition: transform 0.3s ease; cursor: pointer; ${isEncerrado ? "opacity: 0.6; filter: grayscale(80%);" : ""}" onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform='translateY(0)'" onclick="window.open('${canal.link}', '_blank')" title="Assistir no YouTube">
        ${isAoVivo ? `<div class="position-absolute top-0 start-0 w-100 h-100 bg-danger bg-opacity-10 pe-none"></div>` : ""}
        <div class="d-flex flex-column align-items-center justify-content-center flex-shrink-0 position-relative z-1">
          <div class="fw-bolder fs-3" style="line-height: 1; color: var(--ink) !important;">${evento.horario}</div>
        </div>
        <div class="flex-shrink-0 position-relative z-1 d-flex align-items-center justify-content-center rounded-circle text-white fw-bold shadow-sm overflow-hidden" style="width: 48px; height: 48px; background: ${canal.cor}; font-size: 1rem; border: 2px solid ${canal.cor};">
          ${canal.logo ? `<img src="${canal.logo}" alt="${canal.nome}" style="width: 100%; height: 100%; object-fit: cover; background: #fff;" onerror="if(this.src.includes('.png')){this.src=this.src.replace('.png','.jpg');}else if(!this.src.includes('unavatar')){this.src='https://unavatar.io/youtube/${canal.arroba}';}else{this.style.display='none'; this.nextElementSibling.style.display='block';}"><span style="display:none;">${canal.icone}</span>` : canal.icone}
        </div>
        <div class="flex-grow-1 position-relative z-1">
          <div class="d-flex justify-content-between align-items-start mb-1">
            <span class="fw-bold text-uppercase small" style="color: ${canal.cor}; letter-spacing: 0.5px; font-size: 0.75rem;">${canal.nome} <span class="fw-medium text-dark opacity-75 ms-1" style="text-transform: none;">${canal.arroba}</span></span>
            ${aoVivoBadge}
          </div>
          <h4 class="fw-bold fs-5 mb-1" style="color: var(--ink);">${evento.titulo}</h4>
          <p class="text-muted small m-0" style="font-size: 0.85rem;">${evento.desc}</p>
        </div>
      </div>
    `;
    })
    .join("");
}

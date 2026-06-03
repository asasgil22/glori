let elencoGlobal = [];
let chartInstance = null;

document.addEventListener("DOMContentLoaded", () => {
  carregarEstatisticas();
});

async function carregarEstatisticas() {
  const board = document.getElementById("board-jogadores");
  board.innerHTML =
    '<div class="text-center w-100 mt-5 pt-5 text-white-50 fw-bold">Carregando Banco de Dados 2026...</div>';

  try {
    // Aponta exclusivamente para a rota perfeita e engessada de 2026
    const res = await fetch("/api/elenco-2026");

    if (!res.ok) {
      throw new Error("Falha ao buscar dados na API.");
    }

    elencoGlobal = await res.json();

    renderizarGrafico();
    renderizarCampoTatico();
    renderizarListas();
  } catch (e) {
    console.error(e);
    board.innerHTML = `<div class="text-center w-100 mt-5 pt-5 text-danger fw-bold">Erro: ${e.message}</div>`;
  }
}

// =======================================================
// 1. GRÁFICO DE JOGADORES MAIS ESCALADOS (CHART.JS)
// =======================================================
function renderizarGrafico() {
  const ctx = document.getElementById("chart-mais-escalados");
  if (!ctx) return;

  const filtroPosicao =
    document.getElementById("filtro-posicao-jogadores")?.value || "todas";

  let lista = [...elencoGlobal]
    .filter((j) => j.jogos > 0)
    .sort((a, b) => b.jogos - a.jogos);

  if (filtroPosicao !== "todas") {
    lista = lista.filter((j) => {
      const p = String(j.posicao || "")
        .toUpperCase()
        .trim();
      if (filtroPosicao === "G") return p === "G";
      if (filtroPosicao === "D") return p === "D";
      if (filtroPosicao === "M") return p === "M";
      if (filtroPosicao === "A") return p === "F";
      return true;
    });
  }

  ctx.parentElement.style.height = `${Math.max(400, lista.length * 35)}px`;

  const labels = lista.map((j) => j.nome);
  const data = lista.map((j) => j.jogos);

  const backgroundColors = lista.map((j) => {
    const p = String(j.posicao).toUpperCase().trim().charAt(0);
    if (p === "G") return "#f59e0b";
    if (p === "D") return "#3b82f6";
    if (p === "M") return "#10b981";
    if (p === "F" || p === "A") return "#ef4444";
    return "#ffffff";
  });

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Partidas em 2026",
          data,
          backgroundColor: backgroundColors,
          borderRadius: 4,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(0,0,0,0.9)",
          titleFont: { size: 14 },
          bodyFont: { size: 14, weight: "bold" },
          padding: 12,
          callbacks: {
            label: (ctx) => {
              const j = lista[ctx.dataIndex];
              let txt = ` ${j.jogos} Partidas`;
              if (j.gols > 0) txt += ` | ⚽ ${j.gols} Gols`;
              if (j.assistencias > 0) txt += ` | 👟 ${j.assistencias} Ast`;
              return txt;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: "rgba(255,255,255,0.05)" },
          ticks: { color: "#aaa" },
        },
        y: {
          grid: { display: false },
          ticks: { color: "#fff", font: { weight: "bold" } },
        },
      },
    },
  });
}

// =======================================================
// 2. CAMPO TÁTICO: TIME BASE COM FOTOS
// =======================================================
function renderizarCampoTatico() {
  const board = document.getElementById("board-jogadores");

  // INJEÇÃO DE SEGURANÇA CSS (Garante que o campo sempre desenhe)
  if (!document.getElementById("style-campo-tatico-force")) {
    const style = document.createElement("style");
    style.id = "style-campo-tatico-force";
    style.innerHTML = `
      .campo-tatico-premium { background: linear-gradient(180deg, #183e18 50%, #122d12 50%) !important; background-size: 100% 12% !important; border: 2px solid rgba(255,255,255,0.15) !important; border-radius: 12px !important; box-shadow: inset 0 0 60px rgba(0,0,0,0.8) !important; overflow: hidden !important; }
      .campo-linha { position: absolute !important; background: rgba(255,255,255,0.25) !important; }
      .campo-meio { top: 50% !important; left: 0 !important; width: 100% !important; height: 2px !important; transform: translateY(-50%) !important; }
      .campo-circulo { top: 50% !important; left: 50% !important; width: 90px !important; height: 90px !important; border: 2px solid rgba(255,255,255,0.25) !important; border-radius: 50% !important; transform: translate(-50%, -50%) !important; }
      .campo-area-top { top: 0 !important; left: 50% !important; width: 50% !important; height: 16% !important; border: 2px solid rgba(255,255,255,0.25) !important; border-top: 0 !important; transform: translateX(-50%) !important; }
      .campo-area-bottom { bottom: 0 !important; left: 50% !important; width: 50% !important; height: 16% !important; border: 2px solid rgba(255,255,255,0.25) !important; border-bottom: 0 !important; transform: translateX(-50%) !important; }
      .jogador-pin { position: absolute !important; transform: translate(-50%, -50%) !important; display: flex !important; flex-direction: column !important; align-items: center !important; z-index: 2 !important; transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important; }
      .jogador-pin:hover { transform: translate(-50%, -50%) scale(1.1) !important; cursor: pointer !important; z-index: 10 !important; }
      .jogador-pin:hover .jogador-foto { transform: scale(1.3) !important; box-shadow: 0 10px 25px rgba(16, 185, 129, 0.8) !important; border-color: #10b981 !important; z-index: 10 !important; }
      .jogador-pin:hover .jogador-nome { background: #10b981 !important; color: #000 !important; transform: scale(1.1) translateY(2px) !important; }
    `;
    document.head.appendChild(style);
  }

  const sorted = [...elencoGlobal].sort((a, b) => b.jogos - a.jogos);

  const titulares = [
    ...sorted.filter((j) => j.posicao === "G").slice(0, 1),
    ...sorted.filter((j) => j.posicao === "D").slice(0, 4),
    ...sorted.filter((j) => j.posicao === "M").slice(0, 3),
    ...sorted.filter((j) => j.posicao === "F").slice(0, 3),
  ];

  const coords = {
    G: [{ top: "88%", left: "50%" }],
    D: [
      { top: "70%", left: "85%" },
      { top: "74%", left: "68%" },
      { top: "74%", left: "32%" },
      { top: "70%", left: "15%" },
    ],
    M: [
      { top: "54%", left: "65%" },
      { top: "54%", left: "35%" },
      { top: "40%", left: "50%" },
    ],
    F: [
      { top: "25%", left: "80%" },
      { top: "25%", left: "20%" },
      { top: "12%", left: "50%" },
    ],
  };

  let iG = 0,
    iD = 0,
    iM = 0,
    iF = 0;

  board.innerHTML = titulares
    .map((j) => {
      let pos = { top: "50%", left: "50%" };
      if (j.posicao === "G" && coords.G[iG]) pos = coords.G[iG++];
      else if (j.posicao === "D" && coords.D[iD]) pos = coords.D[iD++];
      else if (j.posicao === "M" && coords.M[iM]) pos = coords.M[iM++];
      else if (coords.F[iF]) pos = coords.F[iF++];

      const bgFoto = j.foto ? `background-image: url('${j.foto}');` : "";
      const numeroHtml = j.numero
        ? `<div class="jogador-numero">${j.numero}</div>`
        : "";

      return `
        <div class="jogador-pin" style="top: ${pos.top}; left: ${pos.left};" title="${j.jogos} jogos | ⚽ ${j.gols || 0} Gols">
            <div class="jogador-foto" style="${bgFoto}">${numeroHtml}</div>
            <div class="jogador-nome">${j.nome}</div>
        </div>`;
    })
    .join("");
}

// =======================================================
// 3. LISTAS PREMIUM: ARTILHEIROS E ASSISTÊNCIAS
// =======================================================
function renderizarListas() {
  const boxGols = document.getElementById("lista-gols");
  const boxAssist = document.getElementById("lista-assistencias");

  const artilheiros = [...elencoGlobal]
    .filter((j) => j.gols > 0)
    .sort((a, b) => b.gols - a.gols)
    .slice(0, 8);
  const garcons = [...elencoGlobal]
    .filter((j) => j.assistencias > 0)
    .sort((a, b) => b.assistencias - a.assistencias)
    .slice(0, 8);

  const renderRow = (jogador, index, valor, icone) => `
        <div class="stat-row d-flex justify-content-between align-items-center py-2 px-1">
            <div class="d-flex align-items-center gap-3">
                <span class="text-white-50 fw-bold" style="font-size: 0.9rem;">${index + 1}º</span>
                ${jogador.foto ? `<img src="${jogador.foto}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; background: #222;">` : `<div style="width: 32px; height: 32px; border-radius: 50%; background: #222;"></div>`}
                <span class="fw-bold fs-6 text-light">${jogador.nome}</span>
            </div>
            <span class="stat-badge">${valor} ${icone}</span>
        </div>
    `;

  boxGols.innerHTML = artilheiros.length
    ? artilheiros.map((j, i) => renderRow(j, i, j.gols, "Gols")).join("")
    : '<p class="text-white-50 small mt-2">Sem gols registrados.</p>';
  boxAssist.innerHTML = garcons.length
    ? garcons.map((j, i) => renderRow(j, i, j.assistencias, "Ast")).join("")
    : '<p class="text-white-50 small mt-2">Sem assistências registradas.</p>';
}

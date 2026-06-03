let elencoGlobal = [];
let chartInstance = null;

document.addEventListener("DOMContentLoaded", () => {
  carregarEstatisticas(false);
});

async function forcarSincronizacao(btn) {
  const textoOrig = btn.innerHTML;
  btn.innerHTML =
    '<span class="spinner-border spinner-border-sm"></span> A IA está pensando...';
  btn.disabled = true;
  await carregarEstatisticas(true);
  btn.innerHTML = textoOrig;
  btn.disabled = false;
}

async function carregarEstatisticas(forcar = false) {
  const board = document.getElementById("board-jogadores");
  board.innerHTML =
    '<div class="text-center w-100 mt-5 pt-5 text-white-50 fw-bold">Consultando dados no Servidor...</div>';

  try {
    const url = forcar
      ? "/api/elenco/sincronizar"
      : "/api/elenco?t=" + Date.now();
    const res = await fetch(url, { method: forcar ? "POST" : "GET" });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.erro || "Falha ao buscar dados na API.");
    }

    elencoGlobal = await res.json();

    if (!elencoGlobal || elencoGlobal.length === 0) {
      throw new Error(
        "Base de dados vazia. Clique em 'Solicitar à IA' no topo para gerar os dados.",
      );
    }

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
      if (filtroPosicao === "G") return p === "G" || p === "GOALKEEPER";
      if (filtroPosicao === "D")
        return (
          p === "D" ||
          p === "DEFENDER" ||
          p.startsWith("Z") ||
          p.startsWith("L") ||
          p.includes("DEF")
        );
      if (filtroPosicao === "M")
        return (
          p === "M" ||
          p === "MIDFIELDER" ||
          p.startsWith("V") ||
          p.includes("MID")
        );
      if (filtroPosicao === "A")
        return (
          p === "F" ||
          p === "A" ||
          p === "FORWARD" ||
          p === "ATTACKER" ||
          p.startsWith("P")
        );
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

  const normalizePos = (p) => {
    const s = String(p || "")
      .trim()
      .toUpperCase();
    if (s.startsWith("G")) return "G";
    if (
      s.startsWith("D") ||
      s.startsWith("Z") ||
      s.startsWith("L") ||
      s.includes("DEF")
    )
      return "D";
    if (s.startsWith("M") || s.startsWith("V") || s.includes("MID")) return "M";
    if (
      s.startsWith("A") ||
      s.startsWith("F") ||
      s.startsWith("P") ||
      s.includes("ATT") ||
      s.includes("FOR")
    )
      return "F";
    return "M";
  };

  const sorted = [...elencoGlobal].sort((a, b) => b.jogos - a.jogos);

  const titulares = [
    ...sorted.filter((j) => normalizePos(j.posicao) === "G").slice(0, 1),
    ...sorted.filter((j) => normalizePos(j.posicao) === "D").slice(0, 4),
    ...sorted.filter((j) => normalizePos(j.posicao) === "M").slice(0, 3),
    ...sorted.filter((j) => normalizePos(j.posicao) === "F").slice(0, 3),
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
      const pPos = normalizePos(j.posicao);
      let pos = { top: "50%", left: "50%" };

      if (pPos === "G" && coords.G[iG]) pos = coords.G[iG++];
      else if (pPos === "D" && coords.D[iD]) pos = coords.D[iD++];
      else if (pPos === "M" && coords.M[iM]) pos = coords.M[iM++];
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

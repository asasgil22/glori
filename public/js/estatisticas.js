let noticiasCache = [];

const escapeHtmlGlobal = (str) => {
  if (!str) return "";
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return String(str).replace(/[&<>"']/g, (m) => map[m] || m);
};

document.addEventListener("DOMContentLoaded", async () => {
  // Oculta completamente os painéis de estatísticas de jogadores do HTML (caso existam)
  [
    "chart-jogadores",
    "tactical-board",
    "lista-artilheiros",
    "lista-assistencias",
    "chart-mais-escalados",
    "board-jogadores",
    "lista-gols",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      const card =
        el.closest(".card, .row, .col-12, .col-md-6, .col-lg-6") ||
        el.parentElement;
      if (card) card.style.display = "none";
    }
  });

  try {
    const resposta = await fetch("/api/noticias?admin=true");
    if (resposta.status === 401) {
      window.location.href = "login.html";
      return;
    }
    noticiasCache = await resposta.json();
    atualizarDashboard();
    renderizarTabelaTopNoticias();
    renderizarGraficoCategorias();
    renderizarGraficoFontes(); // Este gráfico de fontes não depende do Twitter.
  } catch (err) {
    console.error("Erro ao carregar dados iniciais:", err);
  }
});

function atualizarDashboard() {
  const publicadas = noticiasCache.filter((n) => n.status !== "rascunho");

  const totalArtigos = publicadas.length;
  const totalViews = publicadas.reduce(
    (sum, n) => sum + (Number(n.visualizacoes) || 0),
    0,
  );

  const topNoticia = [...publicadas].sort(
    (a, b) => (Number(b.visualizacoes) || 0) - (Number(a.visualizacoes) || 0),
  )[0];

  const autoresCount = {};
  publicadas.forEach((n) => {
    if (!n.isRss) {
      const autor = n.autor || "Redação";
      autoresCount[autor] = (autoresCount[autor] || 0) + 1;
    }
  });
  const topAutor =
    Object.keys(autoresCount).sort(
      (a, b) => autoresCount[b] - autoresCount[a],
    )[0] || "-";

  if (document.getElementById("dash-artigos"))
    document.getElementById("dash-artigos").textContent = totalArtigos;
  if (document.getElementById("dash-views"))
    document.getElementById("dash-views").textContent = totalViews;
  if (document.getElementById("dash-top-noticia"))
    document.getElementById("dash-top-noticia").textContent = topNoticia
      ? topNoticia.titulo
      : "-";
  if (document.getElementById("dash-top-autor"))
    document.getElementById("dash-top-autor").textContent = topAutor;
}

function renderizarTabelaTopNoticias() {
  const tbody = document.getElementById("tbody-top-noticias");
  if (!tbody) return;

  const publicadas = noticiasCache.filter((n) => n.status !== "rascunho");
  const top10 = [...publicadas]
    .sort(
      (a, b) => (Number(b.visualizacoes) || 0) - (Number(a.visualizacoes) || 0),
    )
    .slice(0, 10);

  if (top10.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="4" class="text-center text-muted">Nenhuma notícia publicada.</td></tr>';
    return;
  }

  tbody.innerHTML = top10
    .map(
      (n, i) => `
        <tr>
            <td class="text-center fw-bold">${i + 1}º</td>
            <td>
                <a href="/noticia/${n.slug || n.id}" target="_blank" class="text-decoration-none text-dark fw-bold text-truncate d-inline-block" style="max-width: 300px;">
                    ${n.titulo}
                </a>
            </td>
            <td><span class="badge bg-secondary">${n.categoria || "Geral"}</span></td>
            <td class="text-end fw-bold text-success">${n.visualizacoes || 0}</td>
        </tr>
    `,
    )
    .join("");
}

let chartCategoriasInstance = null;
function renderizarGraficoCategorias() {
  const ctx = document.getElementById("chart-categorias");
  if (!ctx) return;

  const publicadas = noticiasCache.filter((n) => n.status !== "rascunho");
  const categorias = {};
  publicadas.forEach((n) => {
    const cat = n.categoria || "Geral";
    categorias[cat] = (categorias[cat] || 0) + (Number(n.visualizacoes) || 0);
  });

  const labels = Object.keys(categorias)
    .sort((a, b) => categorias[b] - categorias[a])
    .slice(0, 5);
  const data = labels.map((l) => categorias[l]);

  if (chartCategoriasInstance) chartCategoriasInstance.destroy();

  try {
    chartCategoriasInstance = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: [
              "#0f766e",
              "#f59e0b",
              "#3b82f6",
              "#ef4444",
              "#8b5cf6",
            ],
            borderWidth: 2,
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });
  } catch (e) {
    console.error("Chart.js bloqueado:", e);
  }
}

let chartFontesInstance = null;
function renderizarGraficoFontes() {
  const ctx = document.getElementById("chart-fontes");
  if (!ctx) return;

  const publicadas = noticiasCache.filter((n) => n.status !== "rascunho");
  const portais = {};
  let autorais = 0;

  publicadas.forEach((n) => {
    if (n.isRss && n.portal) {
      portais[n.portal] = (portais[n.portal] || 0) + 1;
    } else {
      autorais++;
    }
  });

  const labels = ["Autoral", ...Object.keys(portais)];
  const data = [autorais, ...Object.keys(portais).map((p) => portais[p])];

  if (chartFontesInstance) chartFontesInstance.destroy();

  try {
    chartFontesInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Matérias Publicadas",
            data,
            backgroundColor: "#0f766e",
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
      },
    });
  } catch (e) {
    console.error("Chart.js bloqueado:", e);
  }
}

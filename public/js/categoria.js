const slugCategoria = obterSlugCategoria();
const container = document.getElementById("lista-categoria");
const tituloEl = document.getElementById("categoria-titulo");
const contadorEl = document.getElementById("categoria-contador");

let configPortal = null;

document.addEventListener("DOMContentLoaded", carregarPaginaCategoria);

function obterSlugCategoria() {
  const match = window.location.pathname.match(/^\/categoria\/([^/]+)/);
  if (match) return decodeURIComponent(match[1]);
  const params = new URLSearchParams(window.location.search);
  return params.get("categoria") || "";
}

async function carregarPaginaCategoria() {
  if (!slugCategoria) {
    container.innerHTML =
      '<div class="empty-box">Categoria nao informada.</div>';
    return;
  }

  try {
    await carregarConfig();
    const resposta = await fetch(
      `/api/noticias?categoria=${encodeURIComponent(slugCategoria)}&limite=50`,
    );
    if (!resposta.ok) throw new Error("Erro ao carregar");
    const dados = await resposta.json();
    const noticias = dados.grid || dados;
    const lista = Array.isArray(noticias) ? noticias : [];

    const nomeExibicao = lista[0]?.categoria || formatarSlug(slugCategoria);
    tituloEl.textContent = nomeExibicao;
    contadorEl.textContent = `${lista.length} noticia(s)`;

    const portal = configPortal?.nomePortal || "Portal Noticias";
    aplicarMetaSeo({
      title: `${nomeExibicao} | ${portal}`,
      description: `Noticias sobre ${nomeExibicao} no ${portal}.`,
      canonical: urlAbsoluta(`/categoria/${encodeURIComponent(slugCategoria)}`),
      image: imagemAbsoluta(
        configPortal?.logoUrl,
        configPortal?.imagemPadraoUrl,
      ),
      siteName: portal,
      type: "website",
    });

    if (!lista.length) {
      container.innerHTML =
        '<div class="empty-box">Nenhuma noticia publicada nesta categoria.</div>';
      return;
    }

    container.innerHTML = lista
      .map((noticia) => {
        const iconeLocal = configPortal?.faviconUrl
          ? `<img src="${escapeHtml(configPortal.faviconUrl)}" style="height: 14px; border-radius: 2px; margin-top: -2px; margin-right: 4px;" alt="">`
          : "";
        let iconeRss = iconeLocal;

        if (noticia.isRss && noticia.portal) {
          const dominios = {
            FOGÃONET: "fogaonet.com",
            "GLOBO ESPORTE": "ge.globo.com",
            "UOL ESPORTE": "uol.com.br",
            "LANCE!": "lance.com.br",
            OGOL: "ogol.com.br",
            "O DIA": "odia.ig.com.br",
            "ESPN BRASIL": "espn.com.br",
            "TNT SPORTS": "tntsports.com.br",
            "365SCORES": "365scores.com",
          };
          iconeRss = `<img src="https://www.google.com/s2/favicons?domain=${dominios[noticia.portal] || "google.com"}&sz=128" style="height: 14px; border-radius: 2px; margin-top: -2px; margin-right: 4px;" alt="">`;
        }
        return `
      <a class="news-item" href="${urlNoticia(noticia)}">
        <div>
          <div class="news-meta">
            <span>${iconeRss}${escapeHtml(noticia.categoria || "Geral")}</span>
            <span>${formatarData(noticia.data)}</span>
          </div>
          <h2>${escapeHtml(noticia.titulo)}</h2>
          <p>${escapeHtml(noticia.resumo || "")}</p>
        </div>
      </a>
    `;
      })
      .join("");
  } catch {
    container.innerHTML =
      '<div class="empty-box">Nao foi possivel carregar esta categoria.</div>';
  }
}

async function carregarConfig() {
  if (configPortal) return;
  try {
    const resposta = await fetch("/api/config");
    configPortal = await resposta.json();
    aplicarTemaPortal(configPortal);
    renderizarMarca(configPortal, document.getElementById("brand-link"));
  } catch {
    configPortal = {};
  }
}

function urlNoticia(noticia) {
  if (noticia.isRss && noticia.portal !== "FOGÃONET") {
    return noticia.linkExterno;
  }
  return `/noticia/${encodeURIComponent(noticia.slug || noticia.id)}`;
}

function mediaNoticia(noticia) {
  const imagem = noticia.imagemUrl || configPortal?.imagemPadraoUrl;

  if (imagem) {
    return `<img class="thumb" src="${imagem}" alt="${escapeHtml(noticia.titulo)}">`;
  }

  if (noticia.isRss && noticia.portal) {
    const dominios = {
      FOGÃONET: "fogaonet.com",
      "GLOBO ESPORTE": "ge.globo.com",
      "UOL ESPORTE": "uol.com.br",
      "LANCE!": "lance.com.br",
      OGOL: "ogol.com.br",
      "O DIA": "odia.ig.com.br",
      "ESPN BRASIL": "espn.com.br",
      "TNT SPORTS": "tntsports.com.br",
      "365SCORES": "365scores.com",
    };
    const logo = `https://www.google.com/s2/favicons?domain=${dominios[noticia.portal] || "google.com"}&sz=128`;
    return `<div class="thumb-fallback" style="display: flex; align-items: center; justify-content: center;"><img src="${logo}" style="width: 32px; opacity: 0.6;" alt="${escapeHtml(noticia.portal)}"></div>`;
  }

  return `<div class="thumb-fallback">${iniciais(noticia.titulo)}</div>`;
}

function formatarSlug(slug) {
  return String(slug || "")
    .split("-")
    .filter(Boolean)
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(" ");
}

function formatarData(data) {
  if (!data) return "";
  const d = new Date(data);
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const ano = d.getFullYear();
  const hora = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dia}/${mes}/${ano} às ${hora}:${min}`;
}

function iniciais(texto = "PN") {
  return texto
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function escapeHtml(valor = "") {
  return String(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

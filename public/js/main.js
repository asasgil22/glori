let estadoHome = {
  pagina: 1,
  busca: "",
  categoria: "",
  autor: "",
  config: null,
  destaques: [],
  noticiasNaTela: [],
  noticiasWidget: [],
  totalPaginas: 1,
};

window.estadoHome = estadoHome; // Expõe o estado globalmente para o carrossel e eventos HTML

let timeoutBusca = null;

document.addEventListener("DOMContentLoaded", async () => {
  const formFiltros = document.getElementById("form-filtros");
  if (formFiltros) {
    formFiltros.addEventListener("submit", (e) => {
      e.preventDefault();
      aplicarFiltros(e);
    });
  }

  const inputBusca = document.getElementById("busca");
  const liveSearchResults = document.getElementById("live-search-results");
  if (inputBusca) {
    inputBusca.addEventListener("input", (e) => {
      clearTimeout(timeoutBusca);
      const termo = e.target.value.trim();

      if (termo.length < 2) {
        if (liveSearchResults) liveSearchResults.classList.add("d-none");
        timeoutBusca = setTimeout(() => {
          aplicarFiltros(e);
        }, 500);
        return;
      }

      timeoutBusca = setTimeout(async () => {
        try {
          const res = await fetch(
            `/api/noticias?q=${encodeURIComponent(termo)}&limite=5`,
          );
          const dados = await res.json();
          if (dados.grid && dados.grid.length > 0 && liveSearchResults) {
            liveSearchResults.innerHTML =
              dados.grid
                .map(
                  (n) => `
              <a href="${urlNoticia(n)}" class="d-flex align-items-center gap-3 p-3 text-decoration-none border-bottom border-secondary border-opacity-10" style="color: var(--ink); transition: all 0.2s ease;" onmouseover="this.style.background='rgba(0,0,0,0.03)'; this.style.paddingLeft='1.5rem';" onmouseout="this.style.background='transparent'; this.style.paddingLeft='1rem';">
                ${n.imagemUrl ? `<img src="${n.imagemUrl}" style="width: 55px; height: 55px; object-fit: cover; border-radius: 8px;" class="shadow-sm">` : `<div class="shadow-sm d-flex align-items-center justify-content-center fw-bold text-muted" style="width: 55px; height: 55px; background: #f0f0f0; border-radius: 8px; font-size: 0.8rem;">${iniciais(n.titulo)}</div>`}
                <div class="d-flex flex-column justify-content-center">
                  <span class="fw-bold text-truncate" style="max-width: 300px; font-size: 0.95rem;">${escapeHtml(n.titulo)}</span>
                  <div class="d-flex align-items-center gap-2 mt-1">
                    <span class="badge bg-secondary bg-opacity-10 text-secondary" style="font-size: 0.65rem;">${escapeHtml(n.categoria || "Geral")}</span>
                    <span class="text-muted" style="font-size: 0.7rem;">${formatarData(n.data)}</span>
                  </div>
                </div>
              </a>
            `,
                )
                .join("") +
              `<a href="#" class="d-block text-center p-3 text-decoration-none small fw-bold text-body bg-body-tertiary" style="border-bottom-left-radius: 1rem; border-bottom-right-radius: 1rem; transition: background 0.2s;" onclick="document.getElementById('form-filtros').dispatchEvent(new Event('submit'))">Ver todos os resultados ➔</a>`;
            liveSearchResults.classList.remove("d-none");
          } else if (liveSearchResults) {
            liveSearchResults.innerHTML = `<div class="p-3 text-center text-muted small">Nenhum resultado encontrado.</div>`;
            liveSearchResults.classList.remove("d-none");
          }
        } catch (err) {}
        aplicarFiltros(e);
      }, 500); // Aguarda 500ms após o usuário parar de digitar para buscar
    });

    document.addEventListener("click", (e) => {
      if (liveSearchResults && !e.target.closest("#form-filtros")) {
        liveSearchResults.classList.add("d-none");
      }
    });
  }

  await carregarConfig();
  document.body.classList.add("js-ready"); // Libera os textos após aplicar as configurações reais
  if (inputBusca) {
    const rawPlaceholder =
      estadoHome.config.buscaPlaceholder ||
      "Pesquisar notícias, categorias ou autores...";
    const frases = String(rawPlaceholder)
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);
    const sorteada =
      frases.length > 0
        ? frases[Math.floor(Math.random() * frases.length)]
        : "Pesquisar notícias, categorias ou autores...";
    inputBusca.setAttribute("placeholder", sorteada);
  }

  carregarPatrocinadores();
  carregarCategorias();
  carregarNoticias(1);
  carregarTrending();
  carregarWidgetJogos();
  carregarWidgetEnquete();
  carregarWidgetTabela();
  carregarWidgetOdds();
  carregarWidgetVideos();
  carregarWidgetTwitter();
  carregarWidgetOutrosPortais();
  carregarMenuAutores();
  iniciarContadorAtualizacao();
  initSmartHeader();
});

async function carregarConfig() {
  try {
    const resposta = await fetch("/api/config");
    estadoHome.config = await resposta.json();
  } catch {
    estadoHome.config = {
      nomePortal: "Portal Noticias",
      slogan: "",
      corPrincipal: "#2f3a44",
      corAcento: "#0f766e",
      logoUrl: "",
      imagemPadraoUrl: "",
      home: {},
    };
  }

  const config = estadoHome.config;
  document.title = config.nomePortal || "Portal Noticias";
  aplicarMetaSeo({
    title: config.nomePortal || "Portal Noticias",
    description:
      config.slogan ||
      config.seoDescricao ||
      `Noticias em tempo real no ${config.nomePortal || "portal"}.`,
    canonical: urlAbsoluta("/"),
    image: imagemAbsoluta(config.logoUrl, config.imagemPadraoUrl),
    siteName: config.nomePortal || "Portal Noticias",
    type: "website",
  });
  aplicarTemaPortal(config);
  renderizarMarca(config, document.getElementById("brand-link"));
  aplicarConfigWidgets(config);
  aplicarLayoutHome(config);

  const buscaHeader = document.getElementById("busca-header-display");
  if (buscaHeader) {
    if (config.buscaImagemUrl) {
      buscaHeader.innerHTML = `<img src="${config.buscaImagemUrl}" alt="Busca" style="max-height: ${config.buscaImagemAltura || 50}px; object-fit: contain;">`;
    } else {
      buscaHeader.innerHTML = `
        <strong id="busca-titulo-display">${escapeHtml(config.buscaTitulo || "Explore o portal")}</strong>
        <span id="busca-subtitulo-display">${escapeHtml(config.buscaSubtitulo || "busque por titulo, assunto ou categoria")}</span>
      `;
    }
  }

  const homeToolbar = document.getElementById("home-toolbar");
  if (homeToolbar) {
    if (config.buscaCorFundo)
      homeToolbar.style.background = config.buscaCorFundo;
    if (config.buscaPaddingVertical) {
      homeToolbar.style.paddingTop = `${config.buscaPaddingVertical}px`;
      homeToolbar.style.paddingBottom = `${config.buscaPaddingVertical}px`;
    }
  }

  const btnBusca = document.querySelector("#form-filtros button");
  if (btnBusca) {
    if (config.buscaTextoBotao)
      btnBusca.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/></svg> ${escapeHtml(config.buscaTextoBotao)}`;
    if (config.buscaCorTextoBotao)
      btnBusca.style.color = config.buscaCorTextoBotao;
  }
}

function aplicarLayoutHome(config) {
  const home = config.home || {};
  alternarBloco(".home-toolbar", home.mostrarBusca !== false);
  alternarBloco("#carousel-section", home.mostrarCarrossel !== false);
  alternarBloco("#grid-noticias", home.mostrarUltimas !== false);
  alternarBloco("#paginacao", home.mostrarUltimas !== false);
  alternarBloco(".section-heading", home.mostrarUltimas !== false, true);
  alternarBloco("[data-widget='mais-lidas']", home.mostrarMaisLidas !== false);
  alternarBloco("[data-widget='jogos']", home.mostrarJogos !== false);
  alternarBloco("[data-widget='enquete']", home.mostrarEnquete !== false);
  alternarBloco("[data-widget='tabela']", home.mostrarTabela !== false);
  alternarBloco("[data-widget='odds']", home.mostrarOdds !== false);
  alternarBloco("[data-widget='videos']", home.mostrarVideos !== false);
  alternarBloco("[data-widget='twitter']", home.mostrarTwitter !== false);
  alternarBloco("[data-widget='portais']", home.mostrarPortais !== false);

  const sidebar = document.getElementById("sidebar-home");
  const colNoticias = document.getElementById("col-noticias");
  const mostrarSidebar =
    home.mostrarMaisLidas !== false ||
    home.mostrarJogos !== false ||
    home.mostrarEnquete !== false ||
    home.mostrarTabela !== false ||
    home.mostrarOdds !== false ||
    home.mostrarVideos !== false ||
    home.mostrarTwitter !== false ||
    home.mostrarPortais !== false;

  if (sidebar) sidebar.classList.toggle("d-none", !mostrarSidebar);
  if (colNoticias) {
    colNoticias.classList.remove("col-lg-8", "col-12");
    colNoticias.classList.add(mostrarSidebar ? "col-lg-8" : "col-12");
  }
}

function alternarBloco(selector, mostrar, painelInteiro = false) {
  const el = document.querySelector(selector);
  if (!el) return;
  const alvo = painelInteiro
    ? el.closest(".widget-card") || el.closest(".side-panel")
    : el;
  if (alvo) alvo.classList.toggle("d-none", !mostrar);
}

async function carregarCategorias() {
  try {
    const resposta = await fetch("/api/categorias");
    const categorias = await resposta.json();
    const select = document.getElementById("filtro-categoria");
    if (select) {
      select.innerHTML =
        '<option value="">Todas as categorias</option>' +
        categorias
          .map(
            (categoria) =>
              `<option value="${escapeAttr(categoria)}">${escapeHtml(categoria)}</option>`,
          )
          .join("");
    }
  } catch {
    const select = document.getElementById("filtro-categoria");
    if (select)
      select.innerHTML = '<option value="">Todas as categorias</option>';
  }
}

function aplicarFiltros(event) {
  if (event && event.preventDefault) event.preventDefault();
  estadoHome.busca = document.getElementById("busca").value.trim();
  const selectCategoria = document.getElementById("filtro-categoria");
  estadoHome.categoria = selectCategoria ? selectCategoria.value : "";
  estadoHome.autor = ""; // Limpa autor ao usar busca ou categoria
  carregarNoticias(1);
}

let carregandoInfinite = false;

async function carregarNoticias(pagina = 1, atualizacaoSilenciosa = false) {
  if (carregandoInfinite && pagina > 1) return;
  estadoHome.pagina = pagina;
  const grid = document.getElementById("grid-noticias");
  const limite = estadoHome.config?.home?.limiteNoticias || 6;

  if (estadoHome.config?.home?.mostrarUltimas === false) {
    document.querySelector(".section-heading")?.classList.add("d-none");
    grid.innerHTML = "";
    return;
  }

  document.querySelector(".section-heading")?.classList.remove("d-none");

  let filtroEl = document.getElementById("aviso-filtro-autor");
  if (!filtroEl) {
    filtroEl = document.createElement("div");
    filtroEl.id = "aviso-filtro-autor";
    filtroEl.className = "mb-3";
    if (grid) grid.parentNode.insertBefore(filtroEl, grid);
  }
  if (estadoHome.autor) {
    filtroEl.innerHTML = `
      <div class="d-flex justify-content-between align-items-center py-2 px-3 m-0 rounded-3 shadow-sm border" style="background-color: var(--site-bg-color, #ffffff);">
        <span class="small fw-bold text-uppercase"><span class="text-muted fw-normal">Colunista:</span> ${escapeHtml(estadoHome.autor)}</span>
        <button class="btn btn-sm btn-outline-danger rounded-pill px-3 py-0" style="font-size:0.7rem; font-weight:bold; height: 24px;" onclick="filtrarPorAutor('${escapeAttr(estadoHome.autor)}')">Limpar ✕</button>
      </div>`;
  } else {
    filtroEl.innerHTML = "";
  }

  if (!atualizacaoSilenciosa) {
    if (pagina === 1) {
      let skeletonHTML = "";
      for (let i = 0; i < limite; i++) {
        skeletonHTML += `
          <div class="news-item skeleton-item">
            <div class="thumb-wrapper"><div class="skeleton thumb w-100 h-100"></div></div>
            <div>
              <div class="skeleton skeleton-text" style="width: 40%; height: 14px; margin-bottom: 12px;"></div>
              <div class="skeleton skeleton-text" style="width: 95%; height: 28px; margin-bottom: 10px;"></div>
              <div class="skeleton skeleton-text" style="width: 100%; height: 16px; margin-top: 8px;"></div>
              <div class="skeleton skeleton-text" style="width: 80%; height: 16px; margin-top: 6px;"></div>
            </div>
          </div>`;
      }
      grid.innerHTML = skeletonHTML;
    } else {
      const loadingId = "infinite-loading";
      if (!document.getElementById(loadingId)) {
        grid.insertAdjacentHTML(
          "beforeend",
          `<div id="${loadingId}" class="text-center py-4 w-100 opacity-50"><div class="spinner-border spinner-border-sm text-muted" role="status"></div></div>`,
        );
      }
      carregandoInfinite = true;
    }
  }

  const params = new URLSearchParams({
    pagina: String(pagina),
    limite: String(limite),
  });
  if (estadoHome.busca) params.set("q", estadoHome.busca);

  if (estadoHome.categoria) params.set("categoria", estadoHome.categoria);

  if (estadoHome.autor) params.set("autor", estadoHome.autor);

  try {
    const resposta = await fetch(`/api/noticias?${params.toString()}`, {
      cache: "no-store",
    });
    const dados = await resposta.json();

    if (estadoHome.config?.home?.mostrarCarrossel !== false) {
      estadoHome.destaques = dados.destaques || [];
      renderizarCarousel(estadoHome.destaques);
    } else {
      estadoHome.destaques = [];
      document.getElementById("carousel-section").innerHTML = "";
    }

    document.getElementById("infinite-loading")?.remove();

    if (pagina === 1) {
      estadoHome.noticiasNaTela = dados.grid || [];
      renderizarLista(dados.grid || [], true);
    } else {
      estadoHome.noticiasNaTela = [
        ...estadoHome.noticiasNaTela,
        ...(dados.grid || []),
      ];
      renderizarLista(dados.grid || [], false);
    }

    estadoHome.totalPaginas = dados.totalPaginas || 1;
    configurarInfiniteScroll();

    const total = dados.totalItens ?? (dados.grid || []).length;
    const contadorEl = document.getElementById("contador-noticias");
    if (contadorEl) {
      contadorEl.textContent = `${total} noticia(s) encontrada(s)`;
    }
  } catch {
    grid.innerHTML =
      '<div class="empty-box">Nao foi possivel carregar as noticias.</div>';
  }
  carregandoInfinite = false;
}

window.addEventListener("scroll", () => {
  const btnTop = document.getElementById("btn-back-to-top");
  if (btnTop) {
    if (window.scrollY > 500) {
      btnTop.classList.remove("d-none", "opacity-0");
      btnTop.classList.add("d-flex", "opacity-100");
    } else {
      btnTop.classList.remove("d-flex", "opacity-100");
      btnTop.classList.add("d-none", "opacity-0");
    }
  }
});

function renderizarCarousel(destaques) {
  const destaquesFormatados = destaques.map((n) => ({
    ...n,
    titulo: limitarTexto(n.titulo, 90),
    resumo: limitarTexto(n.resumo, 130),
  }));
  renderizarCarrosselPortal(
    document.getElementById("carousel-section"),
    destaquesFormatados,
    estadoHome.config,
    { escapeHtml, urlNoticia, mediaNoticia },
  );
}

function urlNoticia(noticia) {
  if (noticia.isYouTube && noticia.linkExterno) {
    return noticia.linkExterno;
  }
  if (noticia.isRss && noticia.portal !== "FOGÃONET") {
    return `javascript:abrirModalRSSPorId('${noticia.id}')`;
  }
  return `/noticia/${encodeURIComponent(noticia.slug || noticia.id)}`;
}

function mediaNoticia(noticia, classe, fallbackClasse, options = {}) {
  const imagem = noticia.imagemUrl || estadoHome.config?.imagemPadraoUrl;
  let overlayHtml = "";

  if (noticia.isYouTube && noticia.categoria === "AO VIVO") {
    const autorTexto =
      noticia.autor && noticia.autor.startsWith("@")
        ? noticia.autor.substring(1)
        : noticia.autor || "YouTube";

    if (options.isCarousel) {
      overlayHtml = `
        <div class="live-mobile-overlay d-md-none position-absolute top-0 start-0 w-100 h-100 pe-none" style="z-index: 2;"></div>
        <div class="position-absolute top-0 end-0 m-3 px-3 py-1 rounded-pill fw-bold text-white d-md-none shadow-sm" style="z-index: 3; background: rgba(0,0,0,0.65); border: 1px solid rgba(255,255,255,0.2); font-size: 0.75rem; letter-spacing: 0.5px;">@${escapeHtml(autorTexto)}</div>
        <div class="live-play-wrapper position-absolute start-50 translate-middle pe-none" style="z-index: 3;">
          <div class="live-play-btn rounded-circle d-flex align-items-center justify-content-center shadow-lg">
            <svg viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      `;
    } else if (options.isCarouselThumb) {
      overlayHtml = `
        <div class="position-absolute start-50 top-50 translate-middle pe-none" style="z-index: 3;">
          <div class="rounded-circle d-flex align-items-center justify-content-center shadow" style="width: 28px; height: 28px; background: rgba(225, 6, 0, 0.9);">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="#fff" style="margin-left: 2px;"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      `;
    }
  }

  if (imagem) {
    let onerrorAttr = "";
    if (noticia.isYouTube) {
      onerrorAttr = `onerror="if(this.src.includes('maxresdefault.jpg')){this.src='https://i.ytimg.com/vi/${escapeAttr(noticia.id)}/maxresdefault_live.jpg';}else if(this.src.includes('maxresdefault_live')){this.src='https://i.ytimg.com/vi/${escapeAttr(noticia.id)}/hq720.jpg';}else if(this.src.includes('hq720')){this.src='https://i.ytimg.com/vi/${escapeAttr(noticia.id)}/sddefault.jpg';}else if(this.src.includes('sddefault')){this.src='https://i.ytimg.com/vi/${escapeAttr(noticia.id)}/hqdefault.jpg';}else{this.onerror=null;}"`;
    } else if (noticia.isRss && noticia.portal) {
      const logo = obterLogoPortalRSS(noticia.portal);
      onerrorAttr = `onerror="this.onerror=null; this.outerHTML='<div class=\\'${fallbackClasse}\\' style=\\'display: flex; align-items: center; justify-content: center;\\'><img src=\\'${logo}\\' style=\\'width: 48px; opacity: 0.6;\\'></div>';"`;
    } else {
      onerrorAttr = `onerror="this.onerror=null; this.outerHTML='<div class=\\'${fallbackClasse}\\'>${iniciais(noticia.titulo)}</div>';"`;
    }

    if (overlayHtml) {
      return `<div class="position-relative w-100 h-100">${overlayHtml}<img class="${classe || "hero-media"}" src="${imagem}" alt="${escapeHtml(noticia.titulo)}" ${onerrorAttr}></div>`;
    }
    return `<img class="${classe || "hero-media"}" src="${imagem}" alt="${escapeHtml(noticia.titulo)}" ${onerrorAttr}>`;
  }

  if (noticia.isRss && noticia.portal) {
    const logo = obterLogoPortalRSS(noticia.portal);
    return `<div class="${fallbackClasse}" style="display: flex; align-items: center; justify-content: center;"><img src="${logo}" style="width: 48px; opacity: 0.6;" alt="${escapeHtml(noticia.portal)}"></div>`;
  }

  return `<div class="${fallbackClasse}">${iniciais(noticia.titulo)}</div>`;
}

function renderizarLista(noticias, limpar = true) {
  const grid = document.getElementById("grid-noticias");
  if (limpar && !noticias.length) {
    grid.innerHTML =
      '<div class="empty-box">Nenhuma noticia encontrada para este filtro.</div>';
    return;
  }

  const html = noticias
    .map((noticia) => {
      const urlClicavel = urlNoticia(noticia);
      let iconeCategoria = estadoHome.config?.faviconUrl
        ? `<img src="${estadoHome.config.faviconUrl.replace(/"/g, "&quot;")}" style="height: 14px; border-radius: 2px; margin-top: -2px; margin-right: 4px;" alt="">`
        : "";
      if (noticia.isRss && noticia.portal) {
        iconeCategoria = `<img src="${obterLogoPortalRSS(noticia.portal)}" style="height: 14px; border-radius: 2px; margin-top: -2px; margin-right: 4px;" alt="">`;
      }

      const tagCategoria = `<span>${iconeCategoria}${escapeHtml(noticia.categoria || "Geral")}</span>`;

      const urlShare = urlClicavel.startsWith("http")
        ? urlClicavel
        : window.location.origin + urlClicavel;
      const textoShare = encodeURIComponent(noticia.titulo);
      const linkShare = encodeURIComponent(urlShare);
      const rawLink = urlShare.replace(/'/g, "\\'");
      const rawTitle = noticia.titulo.replace(/'/g, "\\'");
      const isFavorito = localStorage
        .getItem("portal_favoritos")
        ?.includes(String(noticia.id));
      const iconeFavorito = isFavorito
        ? '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>'
        : '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>';
      const tempoLeitura = Math.max(
        1,
        Math.ceil(
          (noticia.conteudo || noticia.resumo || "").split(/\s+/).length / 200,
        ),
      );

      return `
    <article class="news-item position-relative reveal-on-scroll">
      <div class="thumb-wrapper">
        ${mediaNoticia(noticia, "thumb w-100 h-100", "thumb-fallback")}
      </div>
      <div class="d-flex flex-column justify-content-between h-100">
        <div>
          <div class="news-meta position-relative" style="z-index: 2;">
          ${tagCategoria}
          <span>${formatarData(noticia.data)} · ${tempoLeitura} min</span>
        </div>
          <h2 class="mt-2 mb-2"><a href="${urlClicavel}" class="text-decoration-none stretched-link" style="color: var(--ink);">${escapeHtml(limitarTexto(noticia.titulo, 90))}</a></h2>
          <p class="d-none d-md-block text-muted" style="font-size: 0.95rem;">${escapeHtml(limitarTexto(noticia.resumo, 130))}</p>
        ${
          Array.isArray(noticia.tags) && noticia.tags.length
            ? `<div class="tag-row position-relative" style="z-index: 2;">${noticia.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>`
            : ""
        }
      </div>
        <!-- Barra de Ações do Card (Aparece apenas no Celular) -->
        <div class="news-item__share d-flex d-md-none justify-content-between align-items-center mt-3 pt-3 border-top position-relative" style="z-index: 2;">
            <div class="d-flex gap-3">
                <button class="btn btn-link p-0 text-muted d-flex align-items-center gap-1 text-decoration-none shadow-none" onclick="if(navigator.vibrate) navigator.vibrate(50); window.toggleFavoritoMain('${noticia.id}', this)" aria-label="Salvar Notícia">
                    ${iconeFavorito} <span class="small fw-bold text-uppercase" style="letter-spacing: 0.05em; font-size: 0.7rem;">Salvar</span>
                </button>
                <button class="btn btn-link p-0 text-muted d-flex align-items-center gap-1 text-decoration-none shadow-none" onclick="if(navigator.vibrate) navigator.vibrate(50); if(navigator.share){ navigator.share({title:'${rawTitle}', url:'${rawLink}'}); } else { navigator.clipboard.writeText('${rawLink}'); window.mostrarNotificacaoMain('🔗 Link copiado para a área de transferência!'); }" aria-label="Compartilhar">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                    <span class="small fw-bold text-uppercase" style="letter-spacing: 0.05em; font-size: 0.7rem;">Compartilhar</span>
                </button>
            </div>
            <div class="d-flex gap-2">
                <a href="https://api.whatsapp.com/send?text=${textoShare}%20-%20${linkShare}" target="_blank" class="share-btn share-btn--whatsapp text-decoration-none text-white d-flex align-items-center justify-content-center shadow-sm" style="width: 42px; height: 42px; background: #25d366; border-radius: 50%;" aria-label="Compartilhar no WhatsApp">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.885-.653-1.482-1.46-1.656-1.758-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                </a>
            </div>
        </div>
      </div>
    </article>
  `;
    })
    .join("");

  if (limpar) {
    grid.innerHTML = html;
  } else {
    grid.insertAdjacentHTML("beforeend", html);
  }

  try {
    if (typeof observarRevelacaoCards === "function") observarRevelacaoCards();
  } catch (e) {
    console.error("Erro na animação:", e);
  }
}

function observarRevelacaoCards() {
  if (typeof IntersectionObserver === "undefined") return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.05, rootMargin: "0px 0px -50px 0px" },
  );

  document
    .querySelectorAll(".news-item.reveal-on-scroll:not(.is-revealed)")
    .forEach((el) => {
      observer.observe(el);
    });
}

let observerInifiniteScroll = null;
function configurarInfiniteScroll() {
  if (observerInifiniteScroll) {
    observerInifiniteScroll.disconnect();
  }

  if (estadoHome.pagina >= estadoHome.totalPaginas) {
    document.getElementById("sentinela-scroll")?.remove();
    return; // Chegou ao fim de todas as notícias
  }

  let sentinel = document.getElementById("sentinela-scroll");
  if (!sentinel) {
    const grid = document.getElementById("grid-noticias");
    if (!grid) return;
    sentinel = document.createElement("div");
    sentinel.id = "sentinela-scroll";
    sentinel.style.cssText = "width: 100%; height: 2px; pointer-events: none;";
    grid.parentNode.insertBefore(sentinel, grid.nextSibling);
  }

  observerInifiniteScroll = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !carregandoInfinite) {
        carregarNoticias(estadoHome.pagina + 1);
      }
    },
    { rootMargin: "1500px" },
  ); // Pede a próxima página muuuito antes do usuário chegar no fim (Efeito Instagram)

  observerInifiniteScroll.observe(sentinel);
}

async function carregarTrending() {
  try {
    const resLidas = await fetch("/api/noticias?maisLidas=true", {
      cache: "no-store",
    });
    const maisLidas = await resLidas.json();

    const maisLidasEl =
      document.getElementById("mais-lidas") ||
      document.getElementById("widget-mais-lidas");
    if (maisLidasEl) {
      const layout = layoutWidget("maisLidas");
      maisLidasEl.innerHTML = maisLidas.length
        ? renderizarMaisLidas(maisLidas, layout)
        : '<div class="empty-box">Sem leituras ainda.</div>';
    }
  } catch {
    const maisLidasEl =
      document.getElementById("mais-lidas") ||
      document.getElementById("widget-mais-lidas");
    if (maisLidasEl)
      maisLidasEl.innerHTML = '<div class="empty-box">Erro ao carregar.</div>';
  }
}

async function carregarWidgetJogos() {
  const alvo =
    document.getElementById("widget-jogos") ||
    document.getElementById("widget-agenda-jogos");
  if (!alvo) return;
  try {
    const resposta = await fetch("/api/jogos", { cache: "no-store" });
    const jogos = await resposta.json();
    const limite = estadoHome.config?.home?.limiteJogos || 3;
    const agenda = [...jogos]
      .sort((a, b) => new Date(a.dataHora) - new Date(b.dataHora))
      .slice(0, limite);

    if (!agenda.length) {
      alvo.innerHTML = '<div class="empty-box">Nenhum jogo cadastrado.</div>';
      return;
    }

    alvo.innerHTML = renderizarJogos(agenda, layoutWidget("jogos"));
  } catch {
    alvo.innerHTML = '<div class="empty-box">Erro ao carregar jogos.</div>';
  }
}

async function carregarWidgetEnquete() {
  const alvo =
    document.getElementById("widget-enquete") ||
    document.getElementById("box-enquete");
  if (!alvo) return;
  try {
    const resposta = await fetch("/api/enquete", { cache: "no-store" });
    const enquete = await resposta.json();
    const total = Object.values(enquete.opcoes || {}).reduce(
      (soma, votos) => soma + votos,
      0,
    );

    // Rastreia no navegador se o usuário já votou nesta pergunta específica
    const hash = btoa(encodeURIComponent(enquete.pergunta || "")).substring(
      0,
      20,
    );
    const jaVotou = localStorage.getItem(`votou_enquete_${hash}`);

    // Substituir título do widget por imagem se houver
    const widgetCard = alvo.closest(".widget-card");
    if (widgetCard) {
      const head = widgetCard.querySelector(".widget-card__head");
      if (head) {
        if (enquete.imagemUrl) {
          head.innerHTML = `<img src="${escapeAttr(enquete.imagemUrl)}" class="w-100" style="object-fit: cover; max-height: 200px;" alt="Enquete">`;
          head.style.padding = "0";
        } else {
          if (typeof aplicarConfigWidgets === "function")
            aplicarConfigWidgets(estadoHome.config);
          head.style.padding = "";
        }
      }
    }

    alvo.innerHTML = renderizarEnquete(
      enquete,
      total,
      layoutWidget("enquete"),
      jaVotou,
    );

    // Dispara a animação fluida das barras de progresso
    if (jaVotou) {
      setTimeout(() => {
        alvo
          .querySelectorAll(".progress-bar[data-final-width]")
          .forEach((el) => {
            el.style.width = el.dataset.finalWidth;
          });
      }, 50);
    }

    // Lógica Popup Mobile (Bottom Sheet Moderno)
    if (
      window.innerWidth <= 768 &&
      estadoHome.config?.home?.mostrarEnquete !== false
    ) {
      const popup = document.getElementById("mobile-poll-popup");

      // Cria o Botão Flutuante (Pílula Mágica) se não existir
      let btnFlutuante = document.getElementById("btn-flutuante-enquete");
      if (!btnFlutuante) {
        btnFlutuante = document.createElement("button");
        btnFlutuante.id = "btn-flutuante-enquete";
        btnFlutuante.className = "floating-poll-btn d-md-none is-hidden";
        btnFlutuante.innerHTML = `📊 Votar na Enquete`;
        btnFlutuante.onclick = () => {
          mostrarEnqueteMobile(enquete, total, hash);
          btnFlutuante.classList.add("is-hidden"); // Esconde ao abrir o popup
        };
        document.body.appendChild(btnFlutuante);
      }

      window.enqueteHashMobile = hash;

      // Gerencia a visibilidade do botão flutuante
      if (jaVotou) {
        btnFlutuante.classList.add("is-hidden");
      } else if (sessionStorage.getItem("enquete_fechada_mobile")) {
        btnFlutuante.classList.remove("is-hidden");
      }

      if (!jaVotou && !sessionStorage.getItem("enquete_fechada_mobile")) {
        mostrarEnqueteMobile(enquete, total, hash);
      } else if (jaVotou && popup && popup.classList.contains("is-visible")) {
        // Atualiza os resultados no popup se o usuário votou por lá
        const popupContent = document.getElementById(
          "mobile-poll-popup-content",
        );
        if (popupContent) {
          let imagemHtml = "";
          if (enquete.imagemUrl) {
            imagemHtml = `<img src="${escapeAttr(enquete.imagemUrl)}" class="w-100 rounded-3 mb-3" style="object-fit: cover; max-height: 140px;" alt="Enquete">`;
          }
          popupContent.innerHTML =
            imagemHtml +
            renderizarEnquete(enquete, total, layoutWidget("enquete"), jaVotou);
          setTimeout(() => {
            popupContent
              .querySelectorAll(".progress-bar[data-final-width]")
              .forEach((el) => {
                el.style.width = el.dataset.finalWidth;
              });
            // Fecha automaticamente após ver o resultado
            setTimeout(fecharEnqueteMobile, 3500);
          }, 50);
        }
      }
    }
  } catch {
    alvo.innerHTML = '<div class="empty-box">Erro ao carregar enquete.</div>';
  }
}

async function votar(opcao, hash, evento) {
  if (evento && evento.currentTarget) {
    const btn = evento.currentTarget;
    btn.innerHTML = `<span class="fw-bold text-muted" style="font-size: 0.9rem;">Computando...</span><div class="spinner-border spinner-border-sm text-muted" role="status"></div>`;
    btn.style.pointerEvents = "none";
    btn.style.opacity = "0.7";
  }

  await fetch("/api/enquete/votar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ opcao }),
  });

  if (hash) {
    localStorage.setItem(`votou_enquete_${hash}`, opcao);
  }
  carregarWidgetEnquete();
}

async function carregarWidgetTabela() {
  const alvo = document.getElementById("widget-tabela");
  if (!alvo) return;
  try {
    const resposta = await fetch("/api/tabela", { cache: "no-store" });
    const tabela = await resposta.json();
    if (tabela.erro) {
      alvo.innerHTML = `<div class="empty-box p-3">${tabela.erro}</div>`;
      return;
    }
    if (!tabela.length) {
      alvo.innerHTML = '<div class="empty-box p-3">Tabela indisponivel.</div>';
      return;
    }
    alvo.innerHTML = renderizarTabela(tabela, layoutWidget("tabela"));
  } catch {
    alvo.innerHTML =
      '<div class="empty-box p-3">Erro ao carregar tabela.</div>';
  }
}

function renderizarTabela(tabela, layout = "completo") {
  const times = layout === "resumido" ? tabela.slice(0, 10) : tabela;
  return `
    <div class="table-responsive p-0 m-0 custom-scrollbar">
      <table class="table table-hover table-borderless align-middle mb-0" style="font-size: 0.85rem;">
        <thead class="sticky-top" style="background: var(--surface); box-shadow: 0 2px 5px rgba(0,0,0,0.05); z-index: 1;">
          <tr style="color: var(--ink); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">
            <th class="text-center py-3" style="width: 40px;">#</th>
            <th class="py-3">Clube</th>
            <th class="text-center py-3" title="Pontos">Pts</th>
            <th class="text-center py-3 text-muted" title="Jogos">J</th>
            <th class="text-center py-3 text-muted d-none d-sm-table-cell" title="Vitórias">V</th>
            <th class="text-center py-3 text-muted d-none d-sm-table-cell" title="Saldo de Gols">SG</th>
          </tr>
        </thead>
        <tbody>
          ${times
            .map((time) => {
              let badgeClass = "bg-secondary bg-opacity-25 text-dark"; // Posição neutra
              const pos = parseInt(time.posicao);

              if (pos <= 4)
                badgeClass = "bg-success text-white"; // Libertadores
              else if (pos <= 6)
                badgeClass = "bg-info text-white"; // Pré-Libertadores
              else if (pos >= 7 && pos <= 12)
                badgeClass = "bg-warning text-dark"; // Sul-Americana
              else if (pos >= 17) badgeClass = "bg-danger text-white"; // Z4

              // Destaque sutil se for o Botafogo
              const isBotafogo = time.nome.toLowerCase().includes("botafogo");
              const rowStyle = isBotafogo
                ? "background-color: color-mix(in srgb, var(--ink) 5%, transparent);"
                : "border-bottom: 1px solid rgba(0,0,0,0.04);";
              const nomeWeight = isBotafogo
                ? "fw-bold"
                : "fw-medium text-secondary";

              return `
            <tr style="${rowStyle} transition: background-color 0.2s ease; color: var(--ink);">
              <td class="text-center py-2">
                <span class="badge rounded-circle ${badgeClass} d-inline-flex align-items-center justify-content-center" style="width: 24px; height: 24px; font-size: 0.75rem;">${time.posicao}</span>
              </td>
              <td class="d-flex align-items-center gap-2 py-2">
                <img src="${escapeAttr(time.escudo)}" style="width: 22px; height: 22px; object-fit: contain;" onerror="this.src='https://e.imguol.com/futebol/brasoes/40x40/padrao.png'; this.onerror=null;">
                <span class="text-truncate ${nomeWeight}" style="max-width: 120px;">${escapeHtml(time.nome)}</span>
              </td>
              <td class="text-center fw-bold fs-6">${escapeHtml(time.pts)}</td>
              <td class="text-center text-muted small">${escapeHtml(time.j)}</td>
              <td class="text-center text-muted small d-none d-sm-table-cell">${escapeHtml(time.v)}</td>
              <td class="text-center text-muted small d-none d-sm-table-cell">${escapeHtml(time.sg)}</td>
            </tr>`;
            })
            .join("")}
        </tbody>
      </table>
      <div class="p-3 bg-light border-top d-flex justify-content-center flex-wrap gap-3 m-0" style="font-size: 0.65rem; border-bottom-left-radius: var(--bs-border-radius); border-bottom-right-radius: var(--bs-border-radius);">
        <div class="d-flex align-items-center gap-1 text-muted text-uppercase fw-bold"><span class="bg-success rounded-circle" style="width:8px; height:8px;"></span> Libertadores</div>
        <div class="d-flex align-items-center gap-1 text-muted text-uppercase fw-bold"><span class="bg-info rounded-circle" style="width:8px; height:8px;"></span> Pré-Liberta</div>
        <div class="d-flex align-items-center gap-1 text-muted text-uppercase fw-bold"><span class="bg-warning rounded-circle" style="width:8px; height:8px;"></span> Sul-Americana</div>
        <div class="d-flex align-items-center gap-1 text-muted text-uppercase fw-bold"><span class="bg-danger rounded-circle" style="width:8px; height:8px;"></span> Z4</div>
      </div>
    </div>
  `;
}

async function carregarWidgetOdds() {
  const alvo = document.getElementById("widget-odds");
  if (!alvo) return;
  try {
    alvo.innerHTML =
      '<div class="text-center p-3 text-muted">Carregando odds...</div>';
    const resposta = await fetch("/api/odds/botafogo?t=" + Date.now(), {
      cache: "no-store",
    });
    const odds = await resposta.json();
    if (!odds || !Array.isArray(odds) || odds.length === 0) {
      alvo.innerHTML = '<div class="empty-box p-3">Sem odds disponíveis.</div>';
      return;
    }
    alvo.innerHTML = renderizarOdds(odds, layoutWidget("odds"));
  } catch (e) {
    alvo.innerHTML = `<div class="empty-box p-3">Erro JS: ${e.message}</div>`;
  }
}

function obterLogoCasaAposta(casa) {
  const dominios = {
    Betano: "br.betano.com",
    Bet365: "bet365.com",
    Sportingbet: "sports.sportingbet.com",
    "1xBet": "1xbet.com",
    Betfair: "betfair.com",
    Pinnacle: "pinnacle.com",
    KTO: "kto.com",
    Betsson: "betsson.com",
    Superbet: "superbet.com",
    EstrelaBet: "estrelabet.com",
    Novibet: "br.novibet.com",
    VBET: "vbet.lat",
    Pixbet: "pixbet.com",
    Betnacional: "betnacional.com",
    "Esportes da Sorte": "esportesdasorte.com",
    "F12.bet": "f12.bet",
    "Aposta Ganha": "apostaganha.bet",
    Brazino777: "brazino777.com",
    Rivalo: "rivalo.com",
  };
  if (!dominios[casa]) return null;
  return `https://www.google.com/s2/favicons?domain=${dominios[casa]}&sz=128`;
}

function renderizarOdds(oddsLista, layout = "cards") {
  return (
    `<div class="d-flex flex-column gap-2">` +
    oddsLista
      .map((odd) => {
        const logoUrl = obterLogoCasaAposta(odd.casa);
        const logoHtml = logoUrl
          ? `<img src="${logoUrl}" style="width: 18px; height: 18px; object-fit: contain; border-radius: 2px;" alt="">`
          : "";

        const destaqueStyle = odd.destaque
          ? "border-color: #f70068 !important; border-width: 2px !important; background-color: rgba(247, 0, 104, 0.12) !important;"
          : "border-color: var(--line) !important; background-color: var(--surface-muted) !important;";

        return `
        <div class="p-2 rounded-3 border ${odd.destaque ? "shadow-sm" : ""}" style="${destaqueStyle} color: var(--ink) !important; transition: all 0.3s ease;">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <div class="d-flex align-items-center gap-2">
          ${logoHtml}
          <strong class="small text-uppercase fw-bold" style="color: var(--ink);">${escapeHtml(odd.casa || "Aguardando")}</strong>
        </div>
            ${odd.destaque ? '<span class="badge" style="background-color: #f70068; color: #fff; font-size: 0.6rem; letter-spacing: 0.5px; text-transform: uppercase; box-shadow: 0 2px 4px rgba(247,0,104,0.3);">Destaque</span>' : ""}
      </div>
      <div class="d-flex justify-content-between gap-2 text-center" style="color: var(--ink);">
            <div class="flex-fill rounded p-1 border shadow-sm" style="background: var(--surface); border-color: var(--line) !important;">
          <span class="d-block text-muted text-uppercase fw-bold" style="font-size: 0.6rem;">Botafogo</span>
          <strong class="d-block">${escapeHtml(odd.vitoria || "-")}</strong>
        </div>
            <div class="flex-fill rounded p-1 border shadow-sm" style="background: var(--surface); border-color: var(--line) !important;">
          <span class="d-block text-muted text-uppercase fw-bold" style="font-size: 0.6rem;">Empate</span>
          <strong class="d-block">${escapeHtml(odd.empate || "-")}</strong>
        </div>
            <div class="flex-fill rounded p-1 border shadow-sm" style="background: var(--surface); border-color: var(--line) !important;">
        <span class="d-block text-muted text-uppercase fw-bold text-truncate mx-auto" style="font-size: 0.6rem; max-width: 70px;" title="${escapeHtml(odd.adversario || "Adversário")}">${escapeHtml(odd.adversario || "Adversário")}</span>
          <strong class="d-block">${escapeHtml(odd.derrota || "-")}</strong>
        </div>
      </div>
    </div>
  `;
      })
      .join("") +
    `</div>`
  );
}

async function carregarWidgetVideos() {
  if (estadoHome.config?.home?.mostrarVideos === false) return;

  const sidebar =
    document.querySelector(".sticky-sidebar") ||
    document.querySelector(".widgets-stack") ||
    document.querySelector(".col-lg-4");
  if (!sidebar) return;

  let container = document.querySelector('[data-widget="videos"]');
  if (!container) {
    container = document.createElement("div");
    container.dataset.widget = "videos";
    container.className = "widget-card widget-card--videos";
    sidebar.appendChild(container);
  }

  const cfg = estadoHome.config?.home?.widgets?.videos || {
    titulo: "Últimos Vídeos",
    subtitulo: "Acompanhe nosso canal",
    icone: "play",
    layout: "carrossel",
  };

  const iconeHtml =
    typeof htmlIconeWidget === "function" ? htmlIconeWidget(cfg.icone) : "";

  container.innerHTML = `
    <header class="widget-card__head">
      ${iconeHtml}
      <div>
        <h2>${escapeHtml(cfg.titulo)}</h2>
        <p>${escapeHtml(cfg.subtitulo)}</p>
      </div>
    </header>
    <div id="widget-videos-content" class="p-3">
      <div class="text-center text-muted">Carregando vídeos...</div>
    </div>
  `;

  if (typeof aplicarConfigWidgets === "function") {
    aplicarConfigWidgets(estadoHome.config);
    aplicarLayoutHome(estadoHome.config);
  }

  const list = document.getElementById("widget-videos-content");
  try {
    const resposta = await fetch("/api/videos");
    const json = await resposta.json();

    if (json.error || !json.data || !json.data.length) {
      list.innerHTML =
        '<div class="empty-box p-3 text-muted small text-center">Nenhum vídeo no momento.</div>';
      return;
    }

    const videos = json.data;
    const textoBotao = json.textoBotao || "";
    list.innerHTML = renderizarVideos(
      videos,
      layoutWidget("videos"),
      textoBotao,
      estadoHome.config?.home,
    );

    // Força o Bootstrap a inicializar e dar 'play' no carrossel dinâmico
    const videoCarouselEl = list.querySelector(".carousel");
    if (videoCarouselEl) {
      const intervaloSec = estadoHome.config?.home?.videosIntervalo ?? 5;
      const bsCarousel = new bootstrap.Carousel(videoCarouselEl, {
        interval: intervaloSec > 0 ? intervaloSec * 1000 : false,
        ride: intervaloSec > 0 ? "carousel" : false,
      });
      if (intervaloSec > 0) bsCarousel.cycle();
    }
  } catch (e) {
    list.innerHTML =
      '<div class="empty-box p-3 text-danger small text-center">Erro ao carregar vídeos.</div>';
  }
}

function renderizarVideos(
  videos,
  layout = "carrossel",
  textoBotao = "",
  homeConfig = {},
) {
  const corBotao = homeConfig.videosCorBotao || "#dc3545";
  const proporcao = homeConfig.videosProporcao || "16/9";
  const intervaloSec = homeConfig.videosIntervalo ?? 5;
  const dataBsInterval =
    intervaloSec > 0
      ? `data-bs-interval="${intervaloSec * 1000}"`
      : 'data-bs-interval="false"';
  const rideAttr =
    intervaloSec > 0 ? 'data-bs-ride="carousel"' : 'data-bs-ride="false"';

  if (layout === "lista") {
    return (
      '<div class="d-flex flex-column gap-3">' +
      videos
        .map(
          (v) => `
      <a href="${escapeAttr(v.link)}" target="_blank" rel="noopener noreferrer" class="text-decoration-none d-block" style="color: var(--ink);">
        <div class="position-relative mb-2">
          <img src="${escapeAttr(v.thumbnail)}" class="w-100 rounded shadow-sm" alt="${escapeAttr(v.titulo)}" style="aspect-ratio: ${escapeAttr(proporcao)}; object-fit: cover;" onerror="this.onerror=null; this.src='https://i.ytimg.com/vi/${escapeAttr(v.id || v.link.split("v=")[1])}/hqdefault.jpg';">
          <div class="position-absolute top-50 start-50 translate-middle">
            <div class="text-white rounded-circle d-flex align-items-center justify-content-center shadow" style="width: 40px; height: 40px; background-color: ${escapeAttr(corBotao)};">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
        </div>
        <strong class="small lh-sm d-block text-truncate-2">${escapeHtml(v.titulo)}</strong>
      </a>
    `,
        )
        .join("") +
      "</div>"
    );
  }

  const carouselId = "videosCarousel" + Date.now();
  return `
    <style>
      #${carouselId} .carousel-item img {
          aspect-ratio: ${escapeHtml(proporcao)};
          object-fit: cover;
          border-radius: 8px;
      }
      #${carouselId} .carousel-caption-custom {
          background: linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, transparent 100%);
          padding: 40px 15px 15px;
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
          bottom: 0;
          left: 0;
          right: 0;
          margin-bottom: 0;
      }
    </style>
    <div id="${carouselId}" class="carousel slide shadow-sm rounded" ${rideAttr}>
      <div class="carousel-inner">
        ${videos
          .map((v, i) => {
            const ytId = escapeAttr(v.id || v.link.split("v=")[1]);
            const fallbackScript = `if(this.src.includes('maxresdefault.jpg')){this.src='https://i.ytimg.com/vi/${ytId}/maxresdefault_live.jpg';}else if(this.src.includes('maxresdefault_live')){this.src='https://i.ytimg.com/vi/${ytId}/hq720.jpg';}else if(this.src.includes('hq720')){this.src='https://i.ytimg.com/vi/${ytId}/sddefault.jpg';}else if(this.src.includes('sddefault')){this.src='https://i.ytimg.com/vi/${ytId}/hqdefault.jpg';}else{this.onerror=null;}`;
            return `
          <div class="carousel-item ${i === 0 ? "active" : ""}" ${dataBsInterval}>
            <a href="${escapeAttr(v.link)}" target="_blank" rel="noopener noreferrer" class="d-block position-relative">
                <img src="${escapeAttr(v.thumbnail)}" class="d-block w-100" alt="${escapeAttr(v.titulo)}" onerror="${fallbackScript}">
                
                <div class="position-absolute top-50 start-50 translate-middle">
                  <div class="text-white rounded-circle d-flex align-items-center justify-content-center shadow" style="width: 48px; height: 48px; background-color: ${escapeAttr(corBotao)};">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                </div>

                <div class="carousel-caption carousel-caption-custom text-start">
                    <h5 class="text-white fw-bold mb-0 text-truncate" title="${escapeAttr(v.titulo)}">${escapeHtml(v.titulo)}</h5>
                    ${textoBotao ? `<p class="text-light mb-0 mt-1 small">${escapeHtml(textoBotao)}</p>` : ""}
                </div>
            </a>
          </div>
        `;
          })
          .join("")}
      </div>
      <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev">
        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Anterior</span>
      </button>
      <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next">
        <span class="carousel-control-next-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Próximo</span>
      </button>
    </div>
  `;
}

async function carregarWidgetTwitter() {
  if (estadoHome.config?.home?.mostrarTwitter === false) return;
  const sidebar =
    document.querySelector(".sticky-sidebar") ||
    document.querySelector(".widgets-stack") ||
    document.querySelector(".col-lg-4");
  if (!sidebar) return;

  let container = document.querySelector('[data-widget="twitter"]');
  if (!container) {
    container = document.createElement("div");
    container.dataset.widget = "twitter";
    container.className = "widget-card widget-card--twitter";
    sidebar.appendChild(container);
  }

  const cfg = estadoHome.config?.home?.widgets?.twitter || {
    titulo: "Comunidade Alvinegra",
    subtitulo: "O que estão falando no X",
    icone: "twitter",
    layout: "carrossel",
    tempoExibicao: 5,
    tipoTransicao: "slide",
    velocidadeTransicao: 500,
    mostrarMidia: true,
  };
  const iconeHtml =
    typeof htmlIconeWidget === "function" ? htmlIconeWidget(cfg.icone) : "";

  container.innerHTML = `
    <header class="widget-card__head">
      ${iconeHtml}
      <div><h2>${escapeHtml(cfg.titulo)}</h2><p>${escapeHtml(cfg.subtitulo)}</p></div>
    </header>
    <div id="widget-twitter-content" class="p-3"><div class="text-center text-muted">Carregando feed...</div></div>
  `;

  if (typeof aplicarConfigWidgets === "function") {
    aplicarConfigWidgets(estadoHome.config);
    aplicarLayoutHome(estadoHome.config);
  }

  const list = document.getElementById("widget-twitter-content");
  try {
    const resposta = await fetch("/api/twitter");
    const tweets = await resposta.json();

    if (!tweets || !tweets.length) {
      list.innerHTML =
        '<div class="empty-box p-3 text-muted small text-center">Nenhuma postagem recente.</div>';
      return;
    }

    if (cfg.layout === "carrossel") {
      const carouselId = "twitterCarousel" + Date.now();
      const interval = (cfg.tempoExibicao || 5) * 1000;
      const transitionClass =
        cfg.tipoTransicao === "fade" ? "carousel-fade" : "";
      const speed = cfg.velocidadeTransicao || 500;
      const style = `<style>#${carouselId} .carousel-item { transition-duration: ${speed}ms !important; }</style>`;

      list.innerHTML =
        style +
        `<div id="${carouselId}" class="carousel slide ${transitionClass}" data-bs-ride="carousel" data-bs-interval="${interval}">
        <div class="carousel-inner">
          ${tweets
            .map((t, i) => {
              const diffEmMinutos = Math.floor(
                (new Date() - new Date(t.data)) / 60000,
              );
              const dataFmt =
                diffEmMinutos < 1
                  ? "Agora"
                  : diffEmMinutos < 60
                    ? `${diffEmMinutos}m`
                    : diffEmMinutos < 1440
                      ? `${Math.floor(diffEmMinutos / 60)}h`
                      : new Date(t.data)
                          .toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                          })
                          .replace(".", "");
              const iconX =
                '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1 2.25h3.437l5.021 6.661L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117l12.006 15.644z"/></svg>';
              const mediaHtml =
                cfg.mostrarMidia && t.mediaUrl
                  ? `<img src="${escapeAttr(t.mediaUrl)}" class="w-100 rounded border border-secondary border-opacity-10 mt-2" style="max-height: 200px; object-fit: cover;">`
                  : "";
              return `
            <div class="carousel-item ${i === 0 ? "active" : ""}">
              <a href="${escapeAttr(t.link)}" target="_blank" rel="noopener noreferrer" class="text-decoration-none d-block p-3 rounded-3 border" style="background: var(--surface-muted); color: var(--ink); border-color: var(--line);">
                <div class="d-flex align-items-center justify-content-between mb-2">
                  <div class="d-flex align-items-center gap-2">
                    ${t.autorAvatar ? `<img src="${escapeAttr(t.autorAvatar)}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">` : `<div style="width:32px; height:32px; border-radius:50%; background:var(--line);"></div>`}
                    <div class="d-flex flex-column lh-1">
                      <strong style="font-size: 0.85rem;">${escapeHtml(t.autorNome)}</strong>
                      <span class="text-muted" style="font-size: 0.7rem;">${escapeHtml(t.autorHandle)}</span>
                    </div>
                  </div>
                  <div class="text-muted d-flex align-items-center gap-2"><span style="font-size: 0.7rem;">${dataFmt}</span>${iconX}</div>
                </div>
                <p class="mb-0 text-break" style="font-size: 0.85rem; line-height: 1.45; white-space: pre-wrap;">${escapeHtml(t.texto)}</p>
                ${mediaHtml}
              </a>
            </div>`;
            })
            .join("")}
        </div>
      </div>`;
      const carouselEl = document.getElementById(carouselId);
      if (carouselEl)
        new bootstrap.Carousel(carouselEl, {
          interval: interval,
          ride: "carousel",
        });
      return;
    }

    list.innerHTML =
      '<div class="d-flex flex-column gap-3">' +
      tweets
        .map((t) => {
          const diffEmMinutos = Math.floor(
            (new Date() - new Date(t.data)) / 60000,
          );
          const dataFmt =
            diffEmMinutos < 1
              ? "Agora"
              : diffEmMinutos < 60
                ? `${diffEmMinutos}m`
                : diffEmMinutos < 1440
                  ? `${Math.floor(diffEmMinutos / 60)}h`
                  : new Date(t.data)
                      .toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                      })
                      .replace(".", "");
          const iconX =
            '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1 2.25h3.437l5.021 6.661L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117l12.006 15.644z"/></svg>';

          const mediaHtml =
            cfg.mostrarMidia && t.mediaUrl
              ? `<img src="${escapeAttr(t.mediaUrl)}" class="w-100 rounded border border-secondary border-opacity-10 mt-2" style="max-height: 200px; object-fit: cover;">`
              : "";

          if (cfg.layout === "lista") {
            return `
          <a href="${escapeAttr(t.link)}" target="_blank" rel="noopener noreferrer" class="text-decoration-none border-bottom pb-2" style="color: var(--ink);">
            <div class="d-flex align-items-center justify-content-between mb-1"><strong class="small">${escapeHtml(t.autorNome)}</strong><span class="text-muted" style="font-size: 0.65rem;">${dataFmt}</span></div>
            <p class="mb-0 small" style="line-height: 1.4;">${escapeHtml(t.texto)}</p>
            ${mediaHtml}
          </a>`;
          }

          return `
        <a href="${escapeAttr(t.link)}" target="_blank" rel="noopener noreferrer" class="text-decoration-none d-block p-3 rounded-3 border" style="background: var(--surface-muted); color: var(--ink); border-color: var(--line); transition: transform 0.2s ease, box-shadow 0.2s ease;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='var(--shadow-soft)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <div class="d-flex align-items-center gap-2">
              ${t.autorAvatar ? `<img src="${escapeAttr(t.autorAvatar)}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">` : `<div style="width:32px; height:32px; border-radius:50%; background:var(--line);"></div>`}
              <div class="d-flex flex-column lh-1"><strong style="font-size: 0.85rem;">${escapeHtml(t.autorNome)}</strong><span class="text-muted" style="font-size: 0.7rem;">${escapeHtml(t.autorHandle)}</span></div>
            </div>
            <div class="text-muted d-flex align-items-center gap-2"><span style="font-size: 0.7rem;">${dataFmt}</span>${iconX}</div>
          </div>
          <p class="mb-0 text-break" style="font-size: 0.85rem; line-height: 1.45; white-space: pre-wrap;">${escapeHtml(t.texto)}</p>
          ${mediaHtml}
        </a>
      `;
        })
        .join("") +
      "</div>";
  } catch (e) {
    list.innerHTML =
      '<div class="empty-box p-3 text-danger small text-center">Erro ao carregar o feed.</div>';
  }
}

async function carregarWidgetOutrosPortais() {
  if (estadoHome.config?.home?.mostrarPortais === false) return;

  const sidebar =
    document.querySelector(".sticky-sidebar") ||
    document.querySelector(".widgets-stack") ||
    document.querySelector(".col-lg-4");
  if (!sidebar) return;

  let container = document.querySelector('[data-widget="portais"]');
  if (!container) {
    container = document.createElement("div");
    container.dataset.widget = "portais";
    container.className = "widget-card widget-card--portais";
    sidebar.appendChild(container);
  }

  const cfg = estadoHome.config?.home?.widgets?.portais || {
    titulo: "Últimas dos Portais",
    subtitulo: "Notícias de outras fontes",
    icone: "lista",
  };

  const iconeHtml =
    typeof htmlIconeWidget === "function"
      ? htmlIconeWidget(cfg.icone)
      : '<span class="widget-card__icon text-secondary"><svg viewBox="0 0 24 24" aria-hidden="true" width="24" height="24"><path d="M9 6h12M9 12h12M9 18h12M5 6h.01M5 12h.01M5 18h.01" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>';

  container.innerHTML = `
    <header class="widget-card__head">
      ${iconeHtml}
      <div>
        <h2>${escapeHtml(cfg.titulo)}</h2>
        <p>${escapeHtml(cfg.subtitulo)}</p>
      </div>
    </header>
    <div id="widget-outros-portais" class="d-flex flex-column gap-2 p-3">
      <div class="text-center text-muted">Carregando notícias...</div>
    </div>
  `;

  // Reordena o widget recém injetado conforme a configuração de arrastar e soltar do Painel
  if (typeof aplicarConfigWidgets === "function") {
    aplicarConfigWidgets(estadoHome.config);
    aplicarLayoutHome(estadoHome.config);
  }

  const list = document.getElementById("widget-outros-portais");
  try {
    const resposta = await fetch("/api/noticias?widgetRss=true", {
      cache: "no-store",
    });
    estadoHome.noticiasWidget = await resposta.json();
    if (!estadoHome.noticiasWidget || !estadoHome.noticiasWidget.length) {
      list.innerHTML =
        '<div class="empty-box p-3 text-muted small text-center">Nenhuma notícia de portais no momento.</div>';
      return;
    }

    list.innerHTML = estadoHome.noticiasWidget
      .map(
        (n) => `
      <a href="javascript:abrirModalRSSPorId('${escapeAttr(n.id)}')" class="text-decoration-none d-flex flex-column py-2 border-bottom border-secondary border-opacity-10" style="color: var(--ink); transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='rgba(0,0,0,0.03)'" onmouseout="this.style.backgroundColor='transparent'">
        <div class="d-flex align-items-center gap-2 mb-1">
          <img src="${obterLogoPortalRSS(n.portal)}" style="height: 14px; width: 14px; border-radius: 2px; object-fit: contain;" alt="">
          <strong class="text-muted text-truncate" style="font-size: 0.65rem; text-transform: uppercase;">${escapeHtml(n.portal)} <span class="fw-normal" style="text-transform: none;">· ${formatarData(n.data)}</span></strong>
        </div>
        <span class="fw-medium text-dark lh-sm" style="font-size: 0.85rem;">${escapeHtml(limitarTexto(n.titulo, 80))}</span>
      </a>
    `,
      )
      .join("");
  } catch (e) {
    list.innerHTML =
      '<div class="empty-box p-3 text-danger small text-center">Erro ao carregar Giro Esportivo.</div>';
  }
}

// ==========================================
// SISTEMA DE ATUALIZAÇÃO AUTOMÁTICA
// ==========================================
let tempoTotalAtualizacao = 60;
let tempoRestanteAtualizacao = tempoTotalAtualizacao;
let intervaloAtualizacao = null;

function iniciarContadorAtualizacao() {
  if (intervaloAtualizacao) clearInterval(intervaloAtualizacao);

  tempoTotalAtualizacao = 60;
  tempoRestanteAtualizacao = tempoTotalAtualizacao;

  intervaloAtualizacao = setInterval(() => {
    tempoRestanteAtualizacao--;

    const barra = document.getElementById("barra-progresso");
    const texto = document.getElementById("texto-atualizacao");

    if (barra && texto) {
      const porcentagem =
        ((tempoTotalAtualizacao - tempoRestanteAtualizacao) /
          tempoTotalAtualizacao) *
        100;
      barra.style.width = `${porcentagem}%`;
      texto.innerHTML = `Atualizando em <b>${tempoRestanteAtualizacao}s</b>`;
    }

    if (tempoRestanteAtualizacao <= 0) {
      tempoRestanteAtualizacao = tempoTotalAtualizacao;
      carregarNoticias(1, true); // O 'true' diz para a função carregar silenciosamente
      carregarTrending();
      carregarWidgetJogos();
      carregarWidgetEnquete();
      carregarWidgetTabela();
      carregarWidgetOdds();
      carregarWidgetVideos();
      carregarWidgetTwitter();
      carregarWidgetOutrosPortais();
    }
  }, 1000);
}

// ==========================================
// SISTEMA RSS DE NOTÍCIAS EXTERNAS
// ==========================================
function obterLogoPortalRSS(portal) {
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
  return `https://www.google.com/s2/favicons?domain=${dominios[portal] || "google.com"}&sz=128`;
}

window.abrirModalRSSPorId = function (id) {
  const noticia = [
    ...estadoHome.destaques,
    ...estadoHome.noticiasNaTela,
    ...(estadoHome.noticiasWidget || []),
  ].find((n) => String(n.id) === String(id));
  if (!noticia) return;
  const temImagem = noticia.imagemUrl && noticia.imagemUrl.trim() !== "";
  const logoOficial = obterLogoPortalRSS(noticia.portal);

  document.getElementById("modal-rss-area-imagem").innerHTML = temImagem
    ? `<img src="${noticia.imagemUrl}" class="w-100 shadow-sm" alt="Capa da Matéria" style="height: 320px; object-fit: cover; border-top-left-radius: 1.2rem; border-top-right-radius: 1.2rem;">`
    : `<div class="w-100 d-flex align-items-center justify-content-center" style="height: 250px; background-color: #262626; border-top-left-radius: 1.2rem; border-top-right-radius: 1.2rem;"><img src="${logoOficial}" style="width: 80px; opacity: 0.2; filter: grayscale(100%);"></div>`;

  document.getElementById("modal-rss-logo-fonte").src = logoOficial;
  document.getElementById("modal-rss-data").innerHTML = formatarData(
    noticia.data,
  );
  document.getElementById("modal-rss-titulo").innerText = noticia.titulo;
  document.getElementById("modal-rss-resumo").innerText =
    noticia.resumo || "Clique no botão abaixo para ler na íntegra.";
  document.getElementById("modal-rss-link-oficial").href = noticia.linkExterno;

  const modalElement = document.getElementById("modalNoticiaRSS");
  const modalBootstrap = new bootstrap.Modal(modalElement);
  modalBootstrap.show();
};

function traduzirStatusSofaScore(status) {
  if (!status) return "";
  const s = status.toLowerCase();
  if (s.includes("1st half")) return status.replace(/1st half/i, "1º Tempo");
  if (s.includes("2nd half")) return status.replace(/2nd half/i, "2º Tempo");
  if (s.includes("halftime")) return "Intervalo";
  if (s.includes("extra time")) return "Prorrogação";
  if (s.includes("penalties")) return "Pênaltis";
  if (s.includes("pause")) return "Pausa";
  if (s.includes("delayed")) return "Atrasado";

  // Se o robô enviar apenas números (minutos), adiciona o apóstrofo
  if (/^\d+$/.test(status.trim())) {
    return `${status.trim()}'`;
  }
  return status;
}

function obterStatusJogo(jogo) {
  if (jogo.status === "inprogress") {
    const tempoTraduzido = traduzirStatusSofaScore(jogo.tempoReal);
    const tempoStr = tempoTraduzido
      ? `<span class="ms-1 fw-bold opacity-75" style="font-size: 0.65rem; letter-spacing: 0;">· ${escapeHtml(tempoTraduzido)}</span>`
      : "";
    return `<span class="game-status game-status--aovivo"><span class="blink"></span>AO VIVO${tempoStr}</span>`;
  }

  if (jogo.placarMandante !== null && jogo.placarVisitante !== null) {
    return '<span class="game-status game-status--encerrado">Encerrado</span>';
  }

  const agora = new Date();
  const dataJogo = new Date(jogo.dataHora);
  const diffMinutos = (agora - dataJogo) / (1000 * 60);

  if (diffMinutos >= 0 && diffMinutos <= 120) {
    return '<span class="game-status game-status--aovivo"><span class="blink"></span>Ao vivo</span>';
  }

  if (
    agora.getDate() === dataJogo.getDate() &&
    agora.getMonth() === dataJogo.getMonth() &&
    agora.getFullYear() === dataJogo.getFullYear() &&
    diffMinutos < 0
  ) {
    return '<span class="game-status game-status--hoje">Hoje</span>';
  }
  return "";
}

function renderizarMaisLidas(noticias, layout = "lista") {
  if (layout === "compacto") {
    return noticias
      .map(
        (noticia) =>
          `<a class="trending-item trending-item--compact" href="${urlNoticia(noticia)}" style="color: var(--ink);">
        <strong>${escapeHtml(limitarTexto(noticia.titulo, 80))}</strong>
        <small>${noticia.visualizacoes || 0} views · ${formatarData(noticia.data)}</small>
      </a>`,
      )
      .join("");
  }

  if (layout === "cards") {
    return noticias
      .map(
        (noticia, index) =>
          `<a class="trending-card" href="${urlNoticia(noticia)}" style="color: var(--ink);">
        <span class="trending-card__rank">${index + 1}</span>
        <span class="trending-card__title">${escapeHtml(limitarTexto(noticia.titulo, 80))}</span>
        <span class="trending-card__meta">${escapeHtml(noticia.categoria || "Geral")} · ${formatarData(noticia.data)}</span>
      </a>`,
      )
      .join("");
  }

  return noticias
    .map(
      (noticia, index) =>
        `<a class="trending-item" href="${urlNoticia(noticia)}" style="color: var(--ink);">
      <span class="trending-rank">${index + 1}</span>
      <span class="trending-copy">
        <strong>${escapeHtml(limitarTexto(noticia.titulo, 80))}</strong>
        <small>${escapeHtml(noticia.categoria || "Geral")} · ${noticia.visualizacoes || 0} views · ${formatarData(noticia.data)}</small>
      </span>
    </a>`,
    )
    .join("");
}

function renderizarJogos(jogos, layout = "cards") {
  if (layout === "linha") {
    return jogos
      .map(
        (jogo) => `
      <article class="game-line">
        <span class="game-line__league">${escapeHtml(jogo.campeonato)} ${obterStatusJogo(jogo)}</span>
        <span class="game-line__team">
          ${jogo.escudoMandante ? `<img src="${escapeHtml(jogo.escudoMandante)}" class="game-line__shield" alt="" onerror="this.style.display='none'">` : ""}
          ${escapeHtml(jogo.mandante)}
        </span>
        <span class="game-line__score">${jogo.placarMandante ?? "-"} x ${jogo.placarVisitante ?? "-"}</span>
        <span class="game-line__team">
          ${escapeHtml(jogo.visitante)}
          ${jogo.escudoVisitante ? `<img src="${escapeHtml(jogo.escudoVisitante)}" class="game-line__shield" alt="" onerror="this.style.display='none'">` : ""}
        </span>
        <time>${formatarData(jogo.dataHora)}</time>
      </article>
    `,
      )
      .join("");
  }

  if (layout === "tabela") {
    return `
      <table class="game-table">
        <thead><tr><th>Jogo</th><th>Placar</th><th>Data</th></tr></thead>
        <tbody>
          ${jogos
            .map(
              (jogo) => `
            <tr>
              <td>
                <div class="d-flex align-items-center gap-1 mb-1">
                  ${jogo.escudoMandante ? `<img src="${escapeHtml(jogo.escudoMandante)}" style="width: 16px; height: 16px; object-fit: contain;" onerror="this.style.display='none'">` : ""}
                  <strong>${escapeHtml(jogo.mandante)} x ${escapeHtml(jogo.visitante)}</strong>
                  ${jogo.escudoVisitante ? `<img src="${escapeHtml(jogo.escudoVisitante)}" style="width: 16px; height: 16px; object-fit: contain;" onerror="this.style.display='none'">` : ""}
                </div>
            <small>${escapeHtml(jogo.campeonato)}</small> ${obterStatusJogo(jogo)}
              </td>
              <td>${jogo.placarMandante ?? "-"} x ${jogo.placarVisitante ?? "-"}</td>
              <td>${formatarData(jogo.dataHora)}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    `;
  }

  return jogos
    .map(
      (jogo) => `
    <article class="game-card">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <div class="game-card__league mb-0">${escapeHtml(jogo.campeonato)}</div>
        ${obterStatusJogo(jogo)}
      </div>
      <div class="game-card__match">
          <div class="game-card__team">
            ${jogo.escudoMandante ? `<img src="${escapeHtml(jogo.escudoMandante)}" class="game-card__shield" alt="" onerror="this.style.display='none'">` : ""}
            <span>${escapeHtml(jogo.mandante)}</span>
          </div>
        <span class="game-card__score">${jogo.placarMandante ?? "-"}<small>x</small>${jogo.placarVisitante ?? "-"}</span>
          <div class="game-card__team">
            ${jogo.escudoVisitante ? `<img src="${escapeHtml(jogo.escudoVisitante)}" class="game-card__shield" alt="" onerror="this.style.display='none'">` : ""}
            <span>${escapeHtml(jogo.visitante)}</span>
          </div>
      </div>
      <time class="game-card__date">${formatarData(jogo.dataHora)}</time>
    </article>
  `,
    )
    .join("");
}

function renderizarEnquete(
  enquete,
  total,
  layout = "barras",
  votoSalvo = null,
) {
  const opcoes = Object.entries(enquete.opcoes || {});
  const hash = btoa(encodeURIComponent(enquete.pergunta || "")).substring(
    0,
    20,
  );

  if (votoSalvo && votoSalvo !== "true") {
    const resultados = opcoes
      .map(([opcao, votos]) => {
        const isMeuVoto = opcao === votoSalvo;
        const pct = total ? Math.round((votos / total) * 100) : 0;
        const barColor = isMeuVoto ? "#f8db52" : "var(--accent, #0f766e)";
        const textColor = "var(--ink)";
        const badgeVoto = isMeuVoto
          ? `<span class="badge ms-2" style="background-color: #f8db52; color: #111; font-size: 0.6rem; letter-spacing: 0.5px; text-transform: uppercase;">Seu voto</span>`
          : "";

        return `
        <div class="mb-3 position-relative">
          <div class="d-flex justify-content-between mb-1 align-items-center" style="font-size: 0.85rem;">
            <span class="fw-bold" style="color: ${textColor};">${escapeHtml(opcao)}${badgeVoto}</span>
            <span class="fw-bold" style="color: ${barColor};">${pct}%</span>
          </div>
          <div class="progress" style="height: 8px; border-radius: 4px; background-color: rgba(128,128,128,0.15); overflow: hidden;">
            <div class="progress-bar" role="progressbar" style="width: 0%; background-color: ${barColor}; transition: width 1.5s cubic-bezier(0.2, 0.8, 0.2, 1);" data-final-width="${pct}%"></div>
          </div>
        </div>
      `;
      })
      .join("");

    return `
      <p class="fw-bold text-dark mb-4" style="font-size: 1.05rem; line-height: 1.4; color: var(--ink) !important;">${escapeHtml(enquete.pergunta)}</p>
      <div>${resultados}</div>
      <p class="mt-4 text-end text-muted m-0 border-top pt-2" style="font-size: 0.75rem; font-weight: 600;">${total} voto(s) computados</p>
    `;
  }

  const botoes = opcoes
    .map(([opcao]) => {
      return `
          <label class="poll-premium-option d-flex align-items-center justify-content-between p-3 mb-2 rounded-3 border" style="cursor: pointer;" onclick="if(navigator.vibrate) navigator.vibrate(40); votar('${escapeAttr(opcao)}', '${hash}', event)">
            <span class="fw-bold" style="color: var(--ink); font-size: 0.9rem;">${escapeHtml(opcao)}</span>
            <div class="poll-premium-radio rounded-circle border d-flex align-items-center justify-content-center bg-white" style="width: 22px; height: 22px;"></div>
          </label>
      `;
    })
    .join("");

  return `
    <p class="fw-bold mb-4" style="font-size: 1.05rem; line-height: 1.4; color: var(--ink) !important;">${escapeHtml(enquete.pergunta)}</p>
    <div>${botoes}</div>
  `;
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
    .map((palavra) => palavra[0])
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

function escapeAttr(valor = "") {
  return escapeHtml(valor).replaceAll("`", "&#096;");
}

function layoutWidget(chave) {
  return estadoHome.config?.home?.widgets?.[chave]?.layout;
}

function limitarTexto(texto, limite) {
  if (!texto) return "";
  if (texto.length <= limite) return texto;
  return texto.substring(0, limite).trim() + "...";
}

async function carregarPatrocinadores() {
  const carouselSection =
    document.getElementById("carousel-section") ||
    document.getElementById("carouselDestaques");
  if (!carouselSection) return;

  if (estadoHome.config?.home?.mostrarPatrocinadores === false) {
    document.getElementById("patrocinadores-wrapper")?.remove();
    return;
  }

  try {
    const resposta = await fetch("/api/patrocinadores");
    if (!resposta.ok) return;
    const patrocinadores = await resposta.json();

    if (patrocinadores.length > 0) {
      let wrapper = document.getElementById("patrocinadores-wrapper");
      if (!wrapper) {
        wrapper = document.createElement("div");
        wrapper.id = "patrocinadores-wrapper";
        wrapper.className =
          "marquee-wrapper secao-botoes-ignorar aos-init aos-animate";
        carouselSection.parentNode.insertBefore(wrapper, carouselSection);
      }

      const altura = estadoHome.config?.home?.patrocinadoresAltura || 40;
      const titulo = estadoHome.config?.home?.patrocinadoresTitulo || "";
      const bg = estadoHome.config?.home?.patrocinadoresCorFundo || "#f8f9fa";
      const color =
        estadoHome.config?.home?.patrocinadoresCorTexto || "#6c757d";
      const velocidade =
        estadoHome.config?.home?.patrocinadoresVelocidade || 25;
      const tituloHtml = titulo
        ? `<div class="patrocinadores-title fw-bold text-uppercase small px-4 border-end me-2" style="white-space: nowrap; letter-spacing: 0.05em; color: ${escapeAttr(color)};">${escapeHtml(titulo)}</div>`
        : "";

      const itemsHtml = patrocinadores
        .map((p) => {
          let content = "";
          if (p.tipo === "imagem" && p.imagemUrl) {
            content = `<img src="${escapeAttr(p.imagemUrl)}" alt="${escapeAttr(p.nome)}" class="patrocinador-img" style="height: ${altura}px; object-fit: contain;">`;
          } else {
            content = `<button class="btn btn-sm border fw-bold flex-shrink-0 patrocinador-txt" style="height: ${altura}px; border-radius: 50px; background: transparent; color: var(--ink-soft); transition: all 0.3s ease;">${escapeHtml(p.nome)}</button>`;
          }

          if (p.link) {
            return `<a href="${escapeAttr(p.link)}" target="_blank" rel="noopener noreferrer" class="d-flex align-items-center flex-shrink-0 text-decoration-none" title="${escapeAttr(p.nome)}">${content}</a>`;
          }
          return `<div class="d-flex align-items-center flex-shrink-0" title="${escapeAttr(p.nome)}">${content}</div>`;
        })
        .join("");

      wrapper.innerHTML = `
        <style>
          .patrocinador-img {
            filter: grayscale(100%) opacity(60%);
            transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
          }
          .patrocinador-img:hover {
            filter: grayscale(0%) opacity(100%);
            transform: scale(1.08);
          }
          .patrocinador-txt:hover {
            background: var(--ink) !important;
            color: var(--surface) !important;
            border-color: var(--ink) !important;
          }
          @media (max-width: 768px) {
            .patrocinador-img {
              filter: grayscale(0%) opacity(100%);
            }
          }
        [data-bs-theme="dark"] .patrocinador-img {
          filter: grayscale(0%) opacity(100%);
        }
        [data-bs-theme="dark"] .patrocinadores-container {
          background-color: #ffffff !important;
          border-color: #e5e5e5 !important;
        }
        [data-bs-theme="dark"] .patrocinadores-container .patrocinador-txt {
          color: #525252 !important;
          border-color: #d4d4d4 !important;
        }
        [data-bs-theme="dark"] .patrocinadores-container .patrocinador-txt:hover {
          background: #111111 !important;
          color: #ffffff !important;
          border-color: #111111 !important;
        }
        [data-bs-theme="dark"] .patrocinadores-container .patrocinadores-title {
          color: #525252 !important;
          border-color: #e5e5e5 !important;
        }
          .patrocinadores-track { display: flex; overflow: hidden; width: 100%; -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent); mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent); }
          .patrocinadores-scroll { display: flex; align-items: center; justify-content: center; gap: 3rem; flex-shrink: 0; min-width: 100%; padding-right: 3rem; animation: scroll-patrocinadores ${velocidade}s linear infinite; }
          .patrocinadores-track:hover .patrocinadores-scroll { animation-play-state: paused; }
          @keyframes scroll-patrocinadores { 0% { transform: translateX(0); } 100% { transform: translateX(-100%); } }
        </style>
        <div class="d-flex align-items-center py-3 px-2 mb-4 rounded-4 patrocinadores-container" style="background-color: color-mix(in srgb, ${escapeAttr(bg)} 60%, transparent); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid var(--line); box-shadow: var(--shadow-soft);">
          ${tituloHtml}
          <div class="patrocinadores-track flex-grow-1">
            <div class="patrocinadores-scroll">${itemsHtml}</div>
            <div class="patrocinadores-scroll" aria-hidden="true">${itemsHtml}</div>
          </div>
        </div>
      `;
    } else {
      document.getElementById("patrocinadores-wrapper")?.remove();
    }
  } catch (e) {
    console.error("Erro ao carregar patrocinadores", e);
  }
}

async function carregarMenuAutores() {
  const menu = document.getElementById("menu");
  const wrapper = document.getElementById("menu-wrapper");
  if (!menu) return;

  if (wrapper) wrapper.style.display = "block";

  const tamanhoFoto = estadoHome.config?.home?.tamanhoFotoAutor || 70;
  const containerWidth = tamanhoFoto + 16; // Reduzido para aproximar as fotos perfeitamente

  // Efeito Premium de Skeleton Loading (Shimmer Pulsante) enquanto baixa os dados
  menu.innerHTML =
    Array(8)
      .fill(
        `
    <div class="autor-menu-item flex-shrink-0 d-flex flex-column align-items-center" style="width: ${containerWidth}px; scroll-snap-align: start;">
      <div style="width: ${tamanhoFoto}px; height: ${tamanhoFoto}px; border-radius: 50%; background: #e9ecef; animation: pulse 1.5s infinite; margin-bottom: 8px;"></div>
      <div style="width: 50px; height: 8px; border-radius: 4px; background: #e9ecef; animation: pulse 1.5s infinite; margin-bottom: 4px;"></div>
      <div style="width: 30px; height: 6px; border-radius: 4px; background: #e9ecef; animation: pulse 1.5s infinite;"></div>
    </div>
  `,
      )
      .join("") +
    `<style>@keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }</style>`;

  try {
    const resposta = await fetch("/api/autores");
    const autores = await resposta.json();

    if (!autores || autores.length === 0) {
      menu.innerHTML = "";
      if (wrapper) wrapper.style.display = "none";
      return;
    }

    const autorAtivo = estadoHome.autor;
    let html = "";

    // Elemento Fixo: Botão "Todos"
    const todosAtivo = !autorAtivo;
    const todosOpacity = autorAtivo ? "0.6" : "1";
    const todosScale = todosAtivo ? "scale(1.05)" : "scale(1)";
    const todosColor = todosAtivo ? "var(--ink)" : "var(--muted)";
    const todosWeight = todosAtivo ? "fw-bolder" : "fw-medium";
    const todosRingClass = todosAtivo ? "ring-active" : "";
    const todosRingStyle = todosAtivo ? "" : "background: transparent;";
    const todosShadow = todosAtivo
      ? "0 6px 15px rgba(0,0,0,0.15)"
      : "0 4px 10px rgba(0,0,0,0.05)";
    const todosDot = todosAtivo
      ? `<div style="width: 4px; height: 4px; border-radius: 50%; background-color: var(--accent, #111); margin-top: 6px;"></div>`
      : `<div style="width: 4px; height: 4px; margin-top: 6px;"></div>`;

    html += `
      <style>
        /* Ocultar barra de rolagem */
        #menu::-webkit-scrollbar { display: none; }
        #menu { -ms-overflow-style: none; scrollbar-width: none; }

        /* Fundo do Menu (Estilo Barra de Busca com Vidro Fosco) */
        #menu-wrapper {
          padding: 16px 8px 12px;
          border-radius: var(--radius-lg);
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid var(--line);
          box-shadow: var(--shadow-soft);
          transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        [data-bs-theme="dark"] #menu-wrapper {
          background: var(--surface-muted) !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          border: 1px solid var(--line) !important;
          box-shadow: none !important;
        }
        
        /* Animação de entrada em Cascata */
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .autor-menu-item {
          animation: fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        
        /* Estilos Premium das Bordas (Sem animação de giro) */
        .ring-active {
          background: linear-gradient(135deg, #a3a3a3, #525252); /* Cinza prateado estático */
        }
        .ring-new {
          background: linear-gradient(135deg, #32d74b, #0da61c); /* Verde 'Melhores Amigos' do Instagram */
        }

        /* Efeito de "Squish" ao tocar (App Nativo) */
        .autor-menu-item:active .position-relative {
          transform: scale(0.92) !important;
          transition: transform 0.1s ease !important;
        }
      </style>
      <div class="autor-menu-item text-center flex-shrink-0 d-flex flex-column align-items-center" style="cursor:pointer; opacity: ${todosOpacity}; transition: all 0.3s ease; width: ${containerWidth}px; scroll-snap-align: center; animation-delay: 0s;" onclick="filtrarPorAutor('', this)">
        <div class="${todosRingClass}" style="width: ${tamanhoFoto}px; height: ${tamanhoFoto}px; border-radius: 50%; padding: 3px; box-shadow: ${todosShadow}; transform: ${todosScale}; transition: all 0.3s ease; ${todosRingStyle}">
            <div style="width: 100%; height: 100%; border-radius: 50%; background: var(--surface-muted); border: 3px solid var(--surface); transition: all 0.3s ease;">
            </div>
        </div>
        <span class="mt-2 ${todosWeight}" style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2; transition: color 0.3s ease; text-align: center;">Todos</span>
        ${todosDot}
      </div>
    `;

    autores.forEach((a) => {
      const vistoEm = localStorage.getItem("autor_visto_" + a.nome);
      a.isNova =
        a.temNovaMateria &&
        (!vistoEm || Number(vistoEm) < (a.dataUltimaMateria || 0));
    });

    const autoresNovos = autores.filter((a) => a.isNova);
    const autoresAntigos = autores.filter((a) => !a.isNova);
    const autoresOrdenados = [...autoresNovos, ...autoresAntigos];

    html += autoresOrdenados
      .map((a, i) => {
        const isAtivo = autorAtivo === a.nome;
        const opacity = autorAtivo && !isAtivo ? "0.4" : "1";

        let ringClass = "";
        let ringStyle = "background: transparent;";
        let shadowGlow = "0 4px 10px rgba(0,0,0,0.08)";

        if (isAtivo) {
          ringClass = "ring-active";
          ringStyle = "";
          shadowGlow = "0 6px 15px rgba(0,0,0,0.15)";
        } else if (a.isNova) {
          ringClass = "ring-new";
          ringStyle = "";
          shadowGlow = "0 6px 15px rgba(0,0,0,0.15)";
        }

        const scale = isAtivo || a.isNova ? "scale(1.06)" : "scale(1)";
        const filter =
          isAtivo || a.isNova ? "brightness(1.02)" : "brightness(1)";
        const textWeight = isAtivo || a.isNova ? "fw-bold" : "fw-medium";
        const textColor = isAtivo || a.isNova ? "var(--ink)" : "var(--muted)";

        const checkBadgeSize = Math.round(tamanhoFoto * 0.31);
        const checkBadge = isAtivo
          ? `<div class="position-absolute text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style="width: ${checkBadgeSize}px; height: ${checkBadgeSize}px; border: 2px solid var(--surface, #fff); right: -2px !important; bottom: -2px !important; background-color: var(--accent, #111); z-index: 2;"><svg viewBox="0 0 24 24" width="${Math.round(checkBadgeSize * 0.55)}" height="${Math.round(checkBadgeSize * 0.55)}" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>`
          : "";
        const svgVerificado =
          '<svg class="ms-1 flex-shrink-0" viewBox="0 0 24 24" width="14" height="14" fill="#1d9bf0"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.918-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.918-1.79-3.918 4 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.46.733 2.73 1.843 3.45-.035.18-.054.36-.054.55 0 2.21 1.71 3.998 3.918 3.998.47 0 .92-.084 1.336-.25C8.49 21.585 9.798 22.5 11.318 22.5s2.816-.917 3.337-2.25c.416.165.866.25 1.336.25 2.21 0 3.918-1.79 3.918-4 0-.19-.02-.37-.054-.55 1.11-.72 1.843-1.99 1.843-3.45zm-11.46 5.31l-4.25-4.25 1.41-1.41 2.84 2.84 7.15-7.15 1.41 1.41-8.56 8.56z"></path></svg>';
        const seloVerificado = a.verificado
          ? a.redes
            ? `<a href="${escapeAttr(a.redes)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()" title="Abrir Rede Social" class="d-inline-flex align-items-center">${svgVerificado}</a>`
            : svgVerificado
          : "";

        const contadorBadge =
          a.totalArtigos > 0
            ? `<span class="badge rounded-pill d-inline-flex align-items-center justify-content-center" style="background: var(--surface-muted); color: var(--ink); border: 1px solid var(--line); font-size: 0.55rem; height: 16px; padding: 0 5px; font-weight: 700;">${a.totalArtigos}</span>`
            : "";
        const dotIndicator = isAtivo
          ? `<div style="width: 4px; height: 4px; border-radius: 50%; background-color: var(--accent, #111); margin-top: 6px;"></div>`
          : `<div style="width: 4px; height: 4px; margin-top: 6px;"></div>`;

        return `
      <div class="autor-menu-item text-center flex-shrink-0 d-flex flex-column align-items-center" style="cursor:pointer; opacity: ${opacity}; transition: opacity 0.3s ease; width: ${containerWidth}px; scroll-snap-align: center; animation-delay: ${(i + 1) * 0.05}s;" onclick="filtrarPorAutor('${escapeAttr(a.nome)}', this)">
        <div class="position-relative" style="width: ${tamanhoFoto}px; height: ${tamanhoFoto}px; transform: ${scale}; transition: all 0.3s ease;">
                <div class="${ringClass}" style="width: 100%; height: 100%; border-radius: 50%; padding: 3px; box-shadow: ${shadowGlow}; transition: all 0.3s ease; ${ringStyle}">
                    <img src="${escapeAttr(a.imagemUrl)}" class="w-100 h-100 rounded-circle" style="object-fit:cover; border: 3px solid var(--surface, #fff); filter: ${filter}; transition: filter 0.3s ease; background: var(--surface-muted, #f8f9fa);" alt="${escapeAttr(a.nome)}" onmouseenter="if(estadoHome.autor !== '${escapeAttr(a.nome)}') { this.parentNode.parentNode.style.transform='scale(1.05)'; this.style.filter='brightness(1.05)'; }" onmouseleave="if(estadoHome.autor !== '${escapeAttr(a.nome)}') { this.parentNode.parentNode.style.transform='scale(1)'; this.style.filter='brightness(1)'; }">
            </div>
            ${checkBadge}
        </div>
    <div class="d-flex flex-column align-items-center mt-2" style="color: ${textColor}; transition: color 0.3s ease; width: calc(100% + 36px); margin: 0 -18px;">
      <div class="d-flex align-items-center justify-content-center w-100 ${textWeight}" style="font-size: 0.75rem; letter-spacing: 0.1px; line-height: 1.2;">
        <span class="text-truncate text-center" style="max-width: ${a.verificado ? "80%" : "100%"};">${escapeHtml(a.nome)}</span>
            ${seloVerificado}
          </div>
              <div class="d-flex align-items-center justify-content-center mt-1 w-100" style="gap: 4px;">
        ${a.arroba ? `<span class="text-truncate text-center" style="color: ${isAtivo ? "var(--ink)" : "var(--muted)"}; opacity: ${isAtivo ? "0.75" : "1"}; font-weight: ${isAtivo ? "600" : "normal"}; font-size: 0.68rem; max-width: ${a.totalArtigos > 0 ? "75%" : "100%"};">${escapeHtml(a.arroba)}</span>` : ""}
            ${contadorBadge}
          </div>
        </div>
        ${dotIndicator}
      </div>
      `;
      })
      .join("");

    menu.innerHTML = html;

    setupMenuScroll();
  } catch (e) {
    console.error("Erro ao carregar menu de autores", e);
  }
}

window.filtrarPorAutor = function (nome, elemento) {
  if (navigator.vibrate) navigator.vibrate(40);

  if (nome) {
    localStorage.setItem("autor_visto_" + nome, Date.now().toString());
  }

  let scrollPos = null;
  if (elemento) {
    const menu = document.getElementById("menu");
    if (menu) {
      const menuRect = menu.getBoundingClientRect();
      const elRect = elemento.getBoundingClientRect();
      scrollPos = elemento.offsetLeft - menuRect.width / 2 + elRect.width / 2;
    }
  }

  if (estadoHome.autor === nome) {
    estadoHome.autor = ""; // Desmarca se clicar no mesmo
  } else {
    estadoHome.autor = nome;
  }
  estadoHome.busca = "";
  estadoHome.categoria = "";
  const buscaEl = document.getElementById("busca");
  if (buscaEl) buscaEl.value = "";
  const catEl = document.getElementById("filtro-categoria");
  if (catEl) catEl.value = "";

  carregarMenuAutores(); // Atualiza a cor e o foco do menu

  if (scrollPos !== null) {
    setTimeout(() => {
      const menu = document.getElementById("menu");
      if (menu) menu.scrollTo({ left: scrollPos, behavior: "smooth" });
    }, 50);
  }

  carregarNoticias(1);
  const grid = document.getElementById("grid-noticias");
  if (grid && estadoHome.autor)
    grid.scrollIntoView({ behavior: "smooth", block: "start" });
};

function setupMenuScroll() {
  const menu = document.getElementById("menu");
  const btnLeft = document.getElementById("menu-scroll-left");
  const btnRight = document.getElementById("menu-scroll-right");
  if (!menu || !btnLeft || !btnRight) return;

  const updateButtons = () => {
    if (menu.scrollWidth > menu.clientWidth) {
      if (menu.scrollLeft > 5) {
        btnLeft.style.setProperty("display", "flex", "important");
      } else {
        btnLeft.style.setProperty("display", "none", "important");
      }
      if (menu.scrollLeft < menu.scrollWidth - menu.clientWidth - 5) {
        btnRight.style.setProperty("display", "flex", "important");
      } else {
        btnRight.style.setProperty("display", "none", "important");
      }
    } else {
      btnLeft.style.setProperty("display", "none", "important");
      btnRight.style.setProperty("display", "none", "important");
    }
  };

  menu.addEventListener("scroll", updateButtons);
  window.addEventListener("resize", updateButtons);
  setTimeout(updateButtons, 150);

  btnLeft.onclick = () => menu.scrollBy({ left: -250, behavior: "smooth" });
  btnRight.onclick = () => menu.scrollBy({ left: 250, behavior: "smooth" });
}

window.toggleFavoritoMain = function (id, btn) {
  let favoritos = JSON.parse(localStorage.getItem("portal_favoritos") || "[]");
  const svg = btn.querySelector("svg");

  if (favoritos.includes(String(id))) {
    favoritos = favoritos.filter((f) => String(f) !== String(id));
    svg.setAttribute("fill", "none");
    mostrarNotificacaoMain("Removido dos favoritos", "danger");
  } else {
    favoritos.push(String(id));
    svg.setAttribute("fill", "currentColor");
    mostrarNotificacaoMain("⭐ Salvo para ler depois!");
  }
  localStorage.setItem("portal_favoritos", JSON.stringify(favoritos));
};

window.mostrarNotificacaoMain = function (mensagem, cor = "success") {
  let toast = document.getElementById("main-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "main-toast";
    toast.style.cssText =
      "position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%) translateY(100px); opacity: 0; transition: all 0.3s ease; z-index: 9999; padding: 12px 24px; border-radius: 50px; color: white; font-weight: bold; font-size: 0.9rem; box-shadow: 0 4px 15px rgba(0,0,0,0.2); pointer-events: none;";
    document.body.appendChild(toast);
  }
  toast.style.backgroundColor = cor === "success" ? "#10b981" : "#f43f5e";
  toast.textContent = mensagem;
  toast.style.transform = "translateX(-50%) translateY(0)";
  toast.style.opacity = "1";
  setTimeout(() => {
    toast.style.transform = "translateX(-50%) translateY(100px)";
    toast.style.opacity = "0";
  }, 3000);
};

function mostrarEnqueteMobile(enquete, total, hash) {
  let popup = document.getElementById("mobile-poll-popup");
  let backdrop = document.getElementById("mobile-poll-backdrop");

  if (!popup) {
    backdrop = document.createElement("div");
    backdrop.id = "mobile-poll-backdrop";
    backdrop.className = "mobile-poll-backdrop";
    document.body.appendChild(backdrop);

    popup = document.createElement("div");
    popup.id = "mobile-poll-popup";
    popup.className = "mobile-poll-popup";
    popup.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="m-0 fw-bolder fs-5 text-uppercase" style="color: var(--ink);">📊 Enquete</h3>
          <button class="btn-close shadow-none" onclick="fecharEnqueteMobile()"></button>
      </div>
      <div id="mobile-poll-popup-content"></div>
    `;
    document.body.appendChild(popup);

    backdrop.addEventListener("click", fecharEnqueteMobile);
  }

  const popupContent = document.getElementById("mobile-poll-popup-content");
  if (popupContent) {
    let imagemHtml = "";
    if (enquete.imagemUrl) {
      imagemHtml = `<img src="${escapeAttr(enquete.imagemUrl)}" class="w-100 rounded-3 mb-3" style="object-fit: cover; max-height: 140px;" alt="Enquete">`;
    }
    const jaVotou = localStorage.getItem(`votou_enquete_${hash}`);
    popupContent.innerHTML =
      imagemHtml +
      renderizarEnquete(enquete, total, layoutWidget("enquete"), jaVotou);
  }

  // Atraso sutil para o popup não pipocar instantaneamente e assustar o usuário
  setTimeout(() => {
    backdrop.classList.add("is-visible");
    popup.classList.add("is-visible");
  }, 100);
}

window.fecharEnqueteMobile = function () {
  const popup = document.getElementById("mobile-poll-popup");
  const backdrop = document.getElementById("mobile-poll-backdrop");
  if (popup) popup.classList.remove("is-visible");
  if (backdrop) backdrop.classList.remove("is-visible");
  sessionStorage.setItem("enquete_fechada_mobile", "true");

  // Se o leitor fechou o popup e ainda NÃO VOTOU, o botão flutuante amarelo entra em cena!
  const btnFlutuante = document.getElementById("btn-flutuante-enquete");
  if (
    btnFlutuante &&
    window.enqueteHashMobile &&
    !localStorage.getItem(`votou_enquete_${window.enqueteHashMobile}`)
  ) {
    btnFlutuante.classList.remove("is-hidden");
  }
};

function fecharEnqueteMobile() {
  window.fecharEnqueteMobile();
}

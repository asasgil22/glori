function obterIdentificadorNoticia() {
  const match = window.location.pathname.match(/^\/noticia\/([^/]+)/);
  if (match) return decodeURIComponent(match[1]);
  const params = new URLSearchParams(window.location.search);
  return params.get("slug") || params.get("id");
}

const identificador = obterIdentificadorNoticia();
const container = document.getElementById("noticia-detalhe");
let configPortal = null;

document.addEventListener("DOMContentLoaded", carregarNoticia);

async function carregarNoticia() {
  if (!identificador) {
    container.innerHTML = '<div class="empty-box">Noticia nao informada.</div>';
    return;
  }

  try {
    await carregarConfig();
    document.body.classList.add("js-ready");

    try {
      const resAutores = await fetch("/api/autores");
      if (resAutores.ok) window.autoresPortal = await resAutores.json();
    } catch (e) {}

    const resposta = await fetch(
      `/api/noticias/${encodeURIComponent(identificador)}`,
    );
    if (!resposta.ok) throw new Error("Noticia nao encontrada");
    const noticia = await resposta.json();

    fetch(`/api/noticias/${encodeURIComponent(identificador)}/view`, {
      method: "POST",
    }).catch(() => {});

    const portal = configPortal?.nomePortal || "Portal Noticias";
    const slug = noticia.slug || noticia.id;

    if (typeof aplicarMetaSeo === "function") {
      try {
        aplicarMetaSeo({
          title: `${noticia.titulo} | ${portal}`,
          description: noticia.resumo || "",
          canonical:
            typeof urlAbsoluta === "function"
              ? urlAbsoluta(`/noticia/${encodeURIComponent(slug)}`)
              : "",
          image:
            typeof imagemAbsoluta === "function"
              ? imagemAbsoluta(noticia.imagemUrl, configPortal?.imagemPadraoUrl)
              : "",
          siteName: portal,
          type: "article",
          jsonLd: {
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            headline: noticia.titulo,
            datePublished: noticia.data,
            author: { "@type": "Person", name: noticia.autor || "Redacao" },
          },
        });
      } catch (e) {
        console.warn("SEO falhou", e);
      }
    }

    const categoriaHtml = noticia.categoria
      ? `<a href="/categoria/${safeSlugify(noticia.categoria)}" class="text-white text-decoration-none">${escapeHtml(noticia.categoria)}</a>`
      : "<span class='text-white'>Geral</span>";

    const autorNome = noticia.autor || "Redacao";
    const autorObj = (window.autoresPortal || []).find(
      (a) => a.nome.trim().toLowerCase() === autorNome.trim().toLowerCase(),
    );

    const imgAutorHtml =
      autorObj && autorObj.imagemUrl
        ? `<img src="${autorObj.imagemUrl}" class="flex-shrink-0 rounded-circle shadow-sm" style="width: 60px; height: 60px; object-fit: cover;" alt="${escapeHtml(autorObj.nome)}">`
        : `<div class="flex-shrink-0 rounded-circle d-flex justify-content-center align-items-center fw-bold shadow-sm" style="width: 60px; height: 60px; font-size: 1.2rem; background: var(--nav); color: #fff;">${iniciais(autorNome)}</div>`;

    const arrobaHtml =
      autorObj && autorObj.arroba
        ? `<span class="text-muted small fw-normal ms-2" style="text-transform: none;">${escapeHtml(autorObj.arroba)}</span>`
        : "";

    const tempoLeitura = Math.max(
      1,
      Math.ceil(
        (noticia.conteudo || noticia.resumo || "").split(/\s+/).length / 200,
      ),
    );

    container.innerHTML = `
      <header class="article-header text-center mb-5 mt-3 mx-auto" style="max-width: 900px;">
        <div class="d-flex justify-content-center align-items-center flex-wrap gap-3 text-muted small text-uppercase fw-bold mb-4 border-bottom border-secondary border-opacity-10 pb-3 position-relative">
          <div class="d-flex align-items-center justify-content-center flex-wrap gap-2 gap-md-3">
              <span class="badge bg-dark px-3 py-2 rounded-pill shadow-sm">${categoriaHtml}</span>
              <span class="d-flex align-items-center gap-1 article-meta-info">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                ${formatarData(noticia.data)} <span class="mx-1 text-secondary">&bull;</span> ${tempoLeitura} min de leitura
              </span>
              <span class="d-flex align-items-center gap-1 article-meta-info">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                ${escapeHtml(autorNome)}
              </span>
          </div>
          <div class="d-flex align-items-center gap-2 ms-md-auto mt-2 mt-md-0">
             <div class="d-none position-relative d-inline-block" id="container-seletor-voz">
               <select id="seletor-voz" class="form-select position-absolute top-0 start-0 w-100 h-100 opacity-0" style="cursor: pointer; z-index: 5;" onchange="window.mudarVoz(this.value)"></select>
               <button class="btn btn-sm btn-outline-secondary rounded-circle fw-bold d-flex align-items-center justify-content-center" type="button" style="width: 32px; height: 32px; font-size: 0.9rem; pointer-events: none;" title="Configurar Voz">
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
               </button>
             </div>
             <button id="btn-traduzir" class="btn btn-sm btn-outline-secondary rounded-circle fw-bold d-flex align-items-center justify-content-center notranslate" translate="no" style="width: 32px; height: 32px; padding: 0;" onclick="window.traduzirArtigoEN(this)" title="Translate to English" aria-label="Translate to English">
               <img src="https://flagcdn.com/w20/us.png" style="width: 18px; border-radius: 2px; opacity: 0.85;" alt="US Flag">
             </button>
             <button id="btn-ouvir" class="btn btn-sm btn-outline-secondary rounded-circle fw-bold d-flex align-items-center justify-content-center" style="width: 32px; height: 32px; font-size: 0.9rem;" onclick="window.ouvirArtigo()" title="Ouvir artigo" aria-label="Ouvir artigo"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg></button>
             <button class="btn btn-sm btn-outline-secondary rounded-circle fw-bold d-flex align-items-center justify-content-center" style="width: 32px; height: 32px; font-size: 0.9rem;" onclick="window.copiarLinkArtigo()" title="Copiar Link"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button>
             <button class="btn btn-sm btn-outline-secondary rounded-circle fw-bold d-flex align-items-center justify-content-center" style="width: 32px; height: 32px; font-size: 0.9rem;" onclick="window.alterarTamanhoFonte(-1)" title="Diminuir fonte">A-</button>
             <button class="btn btn-sm btn-outline-secondary rounded-circle fw-bold d-flex align-items-center justify-content-center" style="width: 32px; height: 32px; font-size: 0.9rem;" onclick="window.alterarTamanhoFonte(1)" title="Aumentar fonte">A+</button>
          </div>
        </div>
        <h1 class="fw-bolder mb-3" style="font-size: clamp(2rem, 4vw, 3rem); letter-spacing: -1px; line-height: 1.1; color: var(--ink);">
          ${escapeHtml(noticia.titulo)}
        </h1>
        ${
          Array.isArray(noticia.tags) && noticia.tags.length
            ? `<div class="d-flex justify-content-center gap-2 flex-wrap mt-4">
                 ${noticia.tags.map((tag) => `<span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 px-2 py-1 fw-medium">${escapeHtml(tag)}</span>`).join("")}
               </div>`
            : ""
        }
      </header>

      <div class="article-media mb-5 text-center mx-auto" style="max-width: 1000px;">
        ${
          noticia.imagemUrl
            ? `<img src="${noticia.imagemUrl}" class="img-fluid w-100 rounded-4 shadow-sm" alt="${escapeHtml(noticia.titulo)}" style="max-height: 550px; object-fit: cover;">`
            : mediaPadrao(noticia)
        }
      </div>

      <div class="article-body mx-auto" style="max-width: 760px;" id="article-body-content">
        ${formatarConteudo(noticia.conteudo || noticia.resumo || "", noticia.imagemUrl)}
      </div>
      
      <div class="mx-auto text-center text-muted" style="max-width: 760px; margin-top: 3.5rem; margin-bottom: 3.5rem; font-size: 1.5rem; letter-spacing: 1rem;">
        &bull; &bull; &bull;
      </div>

      <div class="mx-auto d-flex align-items-center gap-3 p-4 rounded-4 mb-5" style="max-width: 760px; background: var(--surface-muted); border: 1px solid var(--line);">
        ${imgAutorHtml}
        <div>
          <h4 class="m-0 fw-bold fs-6 text-uppercase" style="letter-spacing: 0.5px; color: var(--ink);">${escapeHtml(autorNome)} ${arrobaHtml}</h4>
          <p class="m-0 text-muted small mt-1">Autor e colaborador editorial responsável pela publicação desta matéria no ${escapeHtml(configPortal?.nomePortal || "Portal")}.</p>
        </div>
      </div>

      <div class="mx-auto mt-5 pt-4 border-top border-secondary border-opacity-10 text-center" style="max-width: 760px;">
        <div class="d-flex justify-content-center gap-3 flex-wrap">
           <button class="btn btn-outline-secondary rounded-pill px-4 fw-bold text-uppercase small" style="font-size: 0.8rem; letter-spacing: 0.5px;" onclick="window.scrollTo({top: 0, behavior: 'smooth'})">↑ Voltar ao topo</button>
           ${noticia.isRss && noticia.linkExterno ? `<a href="${noticia.linkExterno}" target="_blank" rel="noopener noreferrer" class="btn btn-primary rounded-pill px-4 fw-bold text-uppercase small" style="font-size: 0.8rem; letter-spacing: 0.5px; background-color: var(--accent); border-color: var(--accent); color: var(--accent-ink);">Ler matéria original ➔</a>` : ""}
           <a href="/" class="btn btn-dark rounded-pill px-4 fw-bold text-uppercase small" style="font-size: 0.8rem; letter-spacing: 0.5px;">Página Inicial</a>
        </div>
      </div>
    `;

    // Ativação do Lightbox Mágico
    setTimeout(() => {
      document.querySelectorAll("#article-body-content img").forEach((img) => {
        img.addEventListener("click", function () {
          if (this.classList.contains("is-zoomed")) {
            this.classList.remove("is-zoomed");
            document.getElementById("zoom-backdrop")?.remove();
          } else {
            this.classList.add("is-zoomed");
            const backdrop = document.createElement("div");
            backdrop.id = "zoom-backdrop";
            backdrop.style.cssText =
              "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);z-index:1050;cursor:zoom-out;transition:opacity 0.3s ease;";
            backdrop.onclick = () => {
              this.classList.remove("is-zoomed");
              backdrop.remove();
            };
            document.body.appendChild(backdrop);
          }
        });
      });
    }, 500);

    if (typeof carregarVozes === "function") carregarVozes();
    if (typeof initHighlightShare === "function") initHighlightShare();
    if (typeof initSmartHeaderNoticia === "function") initSmartHeaderNoticia();
  } catch {
    container.innerHTML =
      '<div class="empty-box">Nao foi possivel carregar esta noticia.</div>';
  }
}

async function carregarConfig() {
  if (configPortal) return;
  try {
    const resposta = await fetch("/api/config");
    configPortal = await resposta.json();
  } catch {
    configPortal = {};
  }
  try {
    if (typeof aplicarTemaPortal === "function")
      aplicarTemaPortal(configPortal);
    if (typeof renderizarMarca === "function") {
      const brandEl =
        document.getElementById("brand-link") ||
        document.querySelector(".navbar-brand");
      if (brandEl) {
        brandEl.innerHTML = ""; // Remove o texto estático "Portal Notícias" da frente da sua Logo
        renderizarMarca(configPortal, brandEl);
      }
    }
  } catch (e) {}
}

function mediaPadrao(noticia) {
  return configPortal?.imagemPadraoUrl
    ? `<img src="${configPortal.imagemPadraoUrl}" class="img-fluid w-100 rounded-4 shadow-sm" alt="${escapeHtml(noticia.titulo)}" style="max-height: 550px; object-fit: cover;">`
    : `<div class="w-100 d-flex align-items-center justify-content-center bg-light rounded-4 shadow-sm text-secondary" style="height: 350px; font-size: 4rem; font-weight: bold; letter-spacing: -2px;">${iniciais(noticia.titulo)}</div>`;
}

function formatarConteudo(texto, imagemCapa = "") {
  const valor = String(texto || "").trim();
  if (!valor) return "<p></p>";

  // Força a conversão de quebras de linha invisíveis em formato HTML antes de sanitizar
  const valorComQuebras = valor
    .replace(/\n{2,}/g, "<br><br>")
    .replace(/\n/g, "<br>");

  let doc;
  if (/<[a-z][\s\S]*>/i.test(valorComQuebras)) {
    doc = sanitizarHtml(valorComQuebras, imagemCapa);
  } else {
    const wrap = valorComQuebras
      .split(/<br\s*\/?>/)
      .filter((p) => p.trim() !== "")
      .map((paragrafo) => `<p>${escapeHtml(paragrafo)}</p>`)
      .join("");
    doc = new DOMParser().parseFromString(wrap, "text/html");
  }

  // Injeta a Letra Capitular (Dropcap) inteligentemente no primeiro parágrafo com texto real
  const firstP = Array.from(doc.body.querySelectorAll("p")).find(
    (p) =>
      p.textContent.replace(/\u00a0/g, "").trim().length > 15 &&
      !p.querySelector("img"),
  );
  if (firstP) firstP.classList.add("dropcap");

  return doc.body.innerHTML;
}

function sanitizarHtml(html, imagemCapa = "") {
  const permitidos = new Set([
    "P",
    "BR",
    "B",
    "STRONG",
    "IFRAME",
    "I",
    "EM",
    "U",
    "S",
    "STRIKE",
    "H2",
    "H3",
    "H4",
    "H5",
    "UL",
    "OL",
    "LI",
    "A",
    "BLOCKQUOTE",
    "IMG",
    "FIGURE",
    "FIGCAPTION",
    "DIV",
    "SPAN",
  ]);
  const doc = new DOMParser().parseFromString(html, "text/html");
  const limpar = (no) => {
    [...no.childNodes].forEach((filho) => {
      if (filho.nodeType === Node.ELEMENT_NODE) {
        if (!permitidos.has(filho.tagName)) {
          const fragmento = document.createDocumentFragment();
          while (filho.firstChild) fragmento.appendChild(filho.firstChild);
          limpar(fragmento);
          filho.replaceWith(fragmento);
          return;
        }
        if (filho.tagName === "A") {
          const href = filho.getAttribute("href") || "";
          if (!/^https?:\/\//i.test(href)) {
            filho.removeAttribute("href");
          } else {
            filho.setAttribute("href", href);
            filho.setAttribute("rel", "noopener noreferrer");
            filho.setAttribute("target", "_blank");
          }
        }
        if (filho.tagName === "IMG") {
          const src = filho.getAttribute("src") || "";
          const srcLimpo = src.replace(/^https?:\/\//i, "").split("?")[0];
          const capaLimpa = (imagemCapa || "")
            .replace(/^https?:\/\//i, "")
            .split("?")[0];

          if (
            capaLimpa &&
            srcLimpo &&
            (srcLimpo.includes(capaLimpa) || capaLimpa.includes(srcLimpo))
          ) {
            const pai = filho.parentElement;
            filho.remove();
            if (
              pai &&
              ["FIGURE", "P", "A"].includes(pai.tagName) &&
              !pai.textContent.trim() &&
              !pai.querySelector("img")
            ) {
              pai.remove();
            }
            return;
          }
          filho.classList.add("img-fluid", "rounded-3", "my-4", "shadow-sm");
        }
        [...filho.attributes].forEach((attr) => {
          if (
            ![
              "href",
              "target",
              "rel",
              "src",
              "alt",
              "class",
              "title",
              "allow",
              "allowfullscreen",
            ].includes(attr.name)
          ) {
            filho.removeAttribute(attr.name);
          }
        });
        limpar(filho);
      }
    });
  };
  limpar(doc.body);

  // Limpeza final de sujeiras do RSS (Remove parágrafos vazios)
  doc.body
    .querySelectorAll("p, h2, h3, h4, h5, blockquote, div")
    .forEach((el) => {
      const textoLivre = el.textContent.replace(/\u00a0/g, "").trim();
      if (
        !textoLivre &&
        !el.querySelector("img") &&
        !el.querySelector("iframe") &&
        !el.querySelector("br")
      ) {
        el.remove();
      }
    });

  // Quebra Dinâmica e Inteligente de Blocos Densos
  const processarNosDensos = (element) => {
    if (element.textContent.length < 150) return; // Processa blocos médios e grandes
    [...element.childNodes].forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        let txt = node.nodeValue;
        // Escapa caracteres HTML para não quebrar o parser ao usar innerHTML
        let safeTxt = txt.replace(/</g, "&lt;").replace(/>/g, "&gt;");

        // Procura por Pontuação Final (. ! ?) seguida de letra maiúscula
        // A trava {3,} garante que ele só quebre se a palavra antes da pontuação for maior que 3 letras (Ignorando Sr., Dr., Av., etc)
        safeTxt = safeTxt.replace(
          /([A-Za-zÀ-ÿ0-9]{3,})([.!?])\s+([A-ZÁÉÍÓÚÂÊÔÇ])/g,
          "$1$2<br><br>$3",
        );

        if (safeTxt !== txt.replace(/</g, "&lt;").replace(/>/g, "&gt;")) {
          const span = document.createElement("span");
          span.innerHTML = safeTxt;
          node.replaceWith(...span.childNodes);
        }
      } else if (
        node.nodeType === Node.ELEMENT_NODE &&
        !["A", "H1", "H2", "H3", "H4", "H5"].includes(node.tagName)
      ) {
        processarNosDensos(node);
      }
    });
  };
  processarNosDensos(doc.body);

  return doc;
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

window.mostrarNotificacaoLeitor = function (mensagem, cor = "success") {
  let toast = document.getElementById("leitor-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "leitor-toast";
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

window.copiarLinkArtigo = function () {
  navigator.clipboard.writeText(window.location.href).then(() => {
    mostrarNotificacaoLeitor("🔗 Link copiado para a área de transferência!");
  });
};

window.toggleFavorito = function (id, btn) {
  let favoritos = JSON.parse(localStorage.getItem("portal_favoritos") || "[]");
  const svg = btn.querySelector("svg");

  if (favoritos.includes(String(id))) {
    favoritos = favoritos.filter((f) => String(f) !== String(id));
    svg.innerHTML =
      '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>';
    mostrarNotificacaoLeitor("Removido dos favoritos", "danger");
  } else {
    favoritos.push(String(id));
    svg.innerHTML =
      '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" fill="currentColor"></path>';
    mostrarNotificacaoLeitor("⭐ Salvo para ler depois!");
  }
  localStorage.setItem("portal_favoritos", JSON.stringify(favoritos));
};

window.tamanhoFonteAtual = 1.15;
window.alterarTamanhoFonte = function (step) {
  const article = document.getElementById("article-body-content");
  if (!article) return;

  window.tamanhoFonteAtual = Math.max(
    0.9,
    Math.min(1.6, window.tamanhoFonteAtual + step * 0.1),
  );
  article.style.fontSize = `${window.tamanhoFonteAtual}rem`;
};

window.vozesDisponiveis = [];
window.vozSelecionada = null;

function carregarVozes() {
  if (!("speechSynthesis" in window)) return;
  const tentarCarregar = () => {
    let vozes = window.speechSynthesis.getVoices();
    if (vozes.length > 0) preencherSeletorVozes(vozes);
  };
  tentarCarregar();
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.addEventListener("voiceschanged", tentarCarregar);
    // Fallback de tempo para navegadores que atrasam o evento (Safari/Mobile)
    setTimeout(tentarCarregar, 500);
    setTimeout(tentarCarregar, 2000);
  }
}

function preencherSeletorVozes(vozes) {
  window.vozesDisponiveis = vozes.filter((v) =>
    String(v.lang || "")
      .toLowerCase()
      .includes("pt"),
  );
  if (window.vozesDisponiveis.length === 0) {
    window.vozesDisponiveis = vozes; // Fallback caso o navegador não retorne a tag PT
  }
  const container = document.getElementById("container-seletor-voz");
  const seletor = document.getElementById("seletor-voz");
  if (!container || !seletor || window.vozesDisponiveis.length === 0) return;

  seletor.innerHTML = window.vozesDisponiveis
    .map((v, i) => {
      let nomeLimpo = v.name
        .replace(/Microsoft|Google|Online \(Natural\)/gi, "")
        .trim();
      return `<option value="${i}">${nomeLimpo} (${
        String(v.lang || "")
          .toUpperCase()
          .includes("BR")
          ? "BR"
          : "PT"
      })</option>`;
    })
    .join("");

  const vozGoogle = window.vozesDisponiveis.findIndex(
    (v) => v.name.includes("Google") || v.name.includes("Natural"),
  );
  let indiceAtivo = vozGoogle !== -1 ? vozGoogle : 0;
  seletor.value = indiceAtivo;
  window.vozSelecionada = window.vozesDisponiveis[indiceAtivo];

  container.classList.remove("d-none");
}

window.mudarVoz = function (index) {
  window.vozSelecionada = window.vozesDisponiveis[index];

  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    window.ouvirArtigo(); // Reinicia a leitura com a nova voz
  }
};

window.ouvirArtigo = function () {
  if (!("speechSynthesis" in window)) {
    mostrarNotificacaoLeitor(
      "Seu navegador não suporta leitura de áudio.",
      "danger",
    );
    return;
  }

  const btnOuvir = document.getElementById("btn-ouvir");
  const iconPlay =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>';
  const iconPause =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';

  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    mostrarNotificacaoLeitor("🔇 Leitura pausada.");
    if (btnOuvir) btnOuvir.innerHTML = iconPlay;
    return;
  }
  const article = document.getElementById("article-body-content");
  if (!article) return;

  const texto = article.innerText;
  const utterance = new SpeechSynthesisUtterance(texto);
  utterance.lang = "pt-BR";
  utterance.rate = 1.05; // Leitura um pouquinho mais dinâmica

  if (window.vozSelecionada) {
    utterance.voice = window.vozSelecionada;
  }

  utterance.onend = () => {
    if (btnOuvir) btnOuvir.innerHTML = iconPlay;
  };

  if (btnOuvir) btnOuvir.innerHTML = iconPause;
  window.speechSynthesis.speak(utterance);
  mostrarNotificacaoLeitor("🔊 Lendo o artigo em voz alta...");
};

function initHighlightShare() {
  const tooltip = document.createElement("div");
  tooltip.id = "highlight-share-tooltip";
  tooltip.style.cssText =
    "position: absolute; display: none; background: var(--nav); color: #fff; padding: 6px 14px; border-radius: 8px; box-shadow: 0 6px 16px rgba(0,0,0,0.3); z-index: 9999; transform: translateX(-50%); font-family: var(--font-ui); transition: opacity 0.2s ease; opacity: 0;";
  tooltip.addEventListener("mousedown", (e) => e.preventDefault()); // Evita tirar a seleção ao clicar
  document.body.appendChild(tooltip);

  document.addEventListener("selectionchange", () => {
    const selection = window.getSelection();
    const texto = selection.toString().trim();
    if (texto.length > 10 && selection.rangeCount > 0) {
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      tooltip.innerHTML = `
        <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(`"${texto}" — leia mais em: ${window.location.href}`)}" target="_blank" style="color: #fff; text-decoration: none; font-size: 0.85rem; font-weight: bold; display: flex; align-items: center; gap: 6px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1 2.25h3.437l5.021 6.661L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117l12.006 15.644z"/></svg> Compartilhar trecho
        </a>
      `;
      tooltip.style.display = "flex";
      tooltip.style.top = `${window.scrollY + rect.top - 45}px`;
      tooltip.style.left = `${rect.left + rect.width / 2}px`;
      setTimeout(() => (tooltip.style.opacity = "1"), 10);
    } else {
      tooltip.style.opacity = "0";
      setTimeout(() => {
        if (tooltip.style.opacity === "0") tooltip.style.display = "none";
      }, 200);
    }
  });
}

function safeSlugify(texto) {
  if (typeof slugifyCategoria === "function") return slugifyCategoria(texto);
  return (
    String(texto || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "geral"
  );
}

window.isTranslatedEN = false;
window.traduzirArtigoEN = function (btn) {
  if (window.isTranslatedEN) {
    window.location.reload(); // Recarrega a página para voltar ao idioma original impecavelmente
    return;
  }

  mostrarNotificacaoLeitor("🇺🇸 Traduzindo página para o Inglês...", "success");

  let gtCombo = document.querySelector(".goog-te-combo");
  if (gtCombo) {
    gtCombo.value = "en";
    gtCombo.dispatchEvent(new Event("change"));
    window.isTranslatedEN = true;
    btn.innerHTML =
      '<img src="https://flagcdn.com/w20/br.png" style="width: 18px; border-radius: 2px; opacity: 0.85;" alt="BR Flag">';
    btn.title = "Voltar para Português";
    return;
  }

  const gtDiv = document.createElement("div");
  gtDiv.id = "google_translate_element";
  // Google ignora elementos com display: none, então usamos position absolute fora da tela
  gtDiv.style.position = "absolute";
  gtDiv.style.top = "-9999px";
  gtDiv.style.visibility = "hidden";
  document.body.appendChild(gtDiv);

  window.googleTranslateElementInit = function () {
    new google.translate.TranslateElement(
      { pageLanguage: "pt", includedLanguages: "en", autoDisplay: false },
      "google_translate_element",
    );

    let tentativas = 0;
    const checkInterval = setInterval(() => {
      const select = document.querySelector(".goog-te-combo");
      if (select) {
        clearInterval(checkInterval);
        select.value = "en";
        select.dispatchEvent(new Event("change"));
        window.isTranslatedEN = true;
        btn.innerHTML =
          '<img src="https://flagcdn.com/w20/br.png" style="width: 18px; border-radius: 2px; opacity: 0.85;" alt="BR Flag">';
        btn.title = "Voltar para Português";
      }
      tentativas++;
      if (tentativas > 30) clearInterval(checkInterval);
    }, 300);
  };

  const script = document.createElement("script");
  script.src =
    "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  document.body.appendChild(script);

  const style = document.createElement("style");
  style.innerHTML = `body { top: 0 !important; position: static !important; } .goog-te-banner-frame, iframe.goog-te-banner-frame, iframe.skiptranslate, .VIpgJd-ZVi9od-aZ2wEe-wOHMyf { display: none !important; } #goog-gt-tt { display: none !important; } .goog-te-spinner-pos { display: none !important; } .goog-text-highlight { background-color: transparent !important; box-shadow: none !important; } html { transform: none !important; height: auto !important; min-height: 100vh !important; }`;
  document.head.appendChild(style);
};

const MODELOS_CARROSSEL = {
  editorial: {
    label: "Editorial",
    desc: "Destaque grande com miniaturas na lateral (padrao).",
  },
  fullscreen: {
    label: "Tela cheia",
    desc: "Imagem ampla com controles sobrepostos.",
  },
  compacto: {
    label: "Compacto",
    desc: "Altura reduzida, ideal para cabecalhos menores.",
  },
  split: {
    label: "Dividido",
    desc: "Imagem e texto lado a lado em cada slide.",
  },
  filmstrip: {
    label: "Filmstrip",
    desc: "Slide principal com faixa de miniaturas abaixo.",
  },
  magazine: {
    label: "Magazine",
    desc: "Titulo centralizado com navegacao discreta.",
  },
  card: {
    label: "Card Flutuante",
    desc: "Texto em um cartao flutuando sobre a imagem.",
  },
  bottom: {
    label: "Texto Abaixo",
    desc: "Imagem ampla com todo o texto no rodape.",
  },
  gradient: {
    label: "Degrade Lateral",
    desc: "Sombra escura na lateral para destacar o texto.",
  },
};

const ALTURAS_CARROSSEL = {
  baixo: 280,
  medio: 380,
  alto: 480,
  extra: 580,
};

function obterOpcoesCarrossel(home = {}) {
  const modelo = MODELOS_CARROSSEL[home.modeloCarrossel]
    ? home.modeloCarrossel
    : "editorial";
  const alturaChave = ALTURAS_CARROSSEL[home.alturaCarrossel]
    ? home.alturaCarrossel
    : "medio";
  const temaClaro = home.temaCarrossel !== "escuro";
  const autoplay =
    Math.min(Math.max(Number(home.autoplayCarrossel) || 6, 3), 20) * 1000;

  return {
    modelo,
    temaClaro,
    classeTema: temaClaro ? "hero-carousel--light" : "hero-carousel--dark",
    classeAltura: `hero-carousel--h-${alturaChave}`,
    alturaPx: ALTURAS_CARROSSEL[alturaChave],
    autoplay,
    mostrarResumo: home.mostrarResumoCarrossel !== false,
    mostrarMiniaturas: home.mostrarMiniaturasCarrossel !== false,
    mostrarContador: home.mostrarContadorCarrossel !== false,
    mostrarSetas: home.mostrarSetasCarrossel !== false,
    mostrarDots: home.mostrarDotsCarrossel !== false,
    efeitoCamaleao: home.efeitoCamaleao === true,
  };
}

function iconeNoticiaCarousel(noticia) {
  let iconeHtml = window.estadoHome?.config?.faviconUrl
    ? `<img src="${window.estadoHome.config.faviconUrl.replace(/"/g, "&quot;")}" style="height: 14px; border-radius: 2px; margin-top: -2px; margin-right: 4px;" alt="">`
    : "";
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
    iconeHtml = `<img src="https://www.google.com/s2/favicons?domain=${dominios[noticia.portal] || "google.com"}&sz=128" style="height: 14px; border-radius: 2px; margin-top: -2px; margin-right: 4px;" alt="">`;
  }
  if (noticia.isYouTube) {
    iconeHtml = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="margin-top: -2px; margin-right: 4px;"><path d="M21.582 6.186a2.684 2.684 0 0 0-1.884-1.894C18.033 3.846 12 3.846 12 3.846s-6.033 0-7.698.446a2.684 2.684 0 0 0-1.884 1.894C2 7.868 2 12 2 12s0 4.132.418 5.814a2.684 2.684 0 0 0 1.884 1.894C5.967 20.154 12 20.154 12 20.154s6.033 0 7.698-.446a2.684 2.684 0 0 0 1.884-1.894C22 16.132 22 12 22 12s0-4.132-.418-5.814zM9.912 15.48V8.52L15.917 12l-6.005 3.48z"/></svg>`;
  }
  return iconeHtml;
}

function slideBase(noticia, index, opcoes, helpers) {
  const { escapeHtml, urlNoticia, mediaNoticia } = helpers;
  const resumo = opcoes.mostrarResumo
    ? `<p class="hero-carousel__excerpt">${escapeHtml(noticia.resumo || "")}</p>`
    : "";

  const isLive = noticia.isYouTube && noticia.categoria === "AO VIVO";
  const kickerClass = isLive
    ? "hero-carousel__kicker hero-carousel__kicker--live"
    : "hero-carousel__kicker";
  const pulseHtml = isLive ? '<span class="live-pulse"></span>' : "";
  const kicker = `<span class="${kickerClass}">${pulseHtml}${iconeNoticiaCarousel(noticia)}${escapeHtml(noticia.categoria || "Geral")}</span>`;
  const targetAttr = noticia.isYouTube
    ? 'target="_blank" rel="noopener noreferrer"'
    : "";
  const ctaText = isLive ? "Assistir ao vivo" : "Ler materia";
  return `
    <article class="hero-carousel__slide ${index === 0 ? "is-active" : ""}" data-index="${index}">
      <a class="hero-carousel__link" href="${urlNoticia(noticia)}" ${targetAttr}>
        <div class="hero-carousel__media">
          ${mediaNoticia(noticia, "hero-carousel__img", "hero-carousel__fallback", { isCarousel: true })}
        </div>
        <div class="hero-carousel__overlay">
          ${kicker}
          <h2 class="hero-carousel__title">${escapeHtml(noticia.titulo)}</h2>
          ${resumo}
          <span class="hero-carousel__cta">${ctaText}</span>
        </div>
      </a>
    </article>
  `;
}

function slideSplit(noticia, index, opcoes, helpers) {
  const { escapeHtml, urlNoticia, mediaNoticia } = helpers;
  const resumo = opcoes.mostrarResumo
    ? `<p class="hero-carousel__excerpt">${escapeHtml(noticia.resumo || "")}</p>`
    : "";

  const isLive = noticia.isYouTube && noticia.categoria === "AO VIVO";
  const kickerClass = isLive
    ? "hero-carousel__kicker hero-carousel__kicker--live"
    : "hero-carousel__kicker";
  const pulseHtml = isLive ? '<span class="live-pulse"></span>' : "";
  const kicker = `<span class="${kickerClass}">${pulseHtml}${iconeNoticiaCarousel(noticia)}${escapeHtml(noticia.categoria || "Geral")}</span>`;
  const targetAttr = noticia.isYouTube
    ? 'target="_blank" rel="noopener noreferrer"'
    : "";
  const ctaText = isLive ? "Assistir ao vivo" : "Ler materia";
  return `
    <article class="hero-carousel__slide hero-carousel__slide--split ${index === 0 ? "is-active" : ""}" data-index="${index}">
      <a class="hero-carousel__split-link" href="${urlNoticia(noticia)}" ${targetAttr}>
        <div class="hero-carousel__split-media">
          ${mediaNoticia(noticia, "hero-carousel__img", "hero-carousel__fallback", { isCarousel: true })}
        </div>
        <div class="hero-carousel__split-copy">
          ${kicker}
          <h2 class="hero-carousel__title">${escapeHtml(noticia.titulo)}</h2>
          ${resumo}
          <span class="hero-carousel__cta">${ctaText}</span>
        </div>
      </a>
    </article>
  `;
}

function toolbarDots(destaques, total, opcoes = {}) {
  const progresso = opcoes.mostrarDots
    ? `<div class="hero-carousel__progress" aria-hidden="true">
        ${destaques
          .map(
            (_, index) => `
          <button type="button" class="hero-carousel__dot ${index === 0 ? "is-active" : ""}" data-go="${index}" aria-label="Ir para destaque ${index + 1}"></button>
        `,
          )
          .join("")}
      </div>`
    : "";

  const contador = opcoes.mostrarContador
    ? `<span class="hero-carousel__counter"><strong>01</strong> / ${String(total).padStart(2, "0")}</span>`
    : "";

  const setas = opcoes.mostrarSetas
    ? `<button type="button" class="hero-carousel__btn d-none" data-dir="prev" aria-label="Destaque anterior">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
      </button>
      <button type="button" class="hero-carousel__btn d-none" data-dir="next" aria-label="Proximo destaque">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
      </button>`
    : "";

  if (!progresso && !contador && !setas) return "";

  const classesToolbar = [
    "hero-carousel__toolbar",
    !opcoes.mostrarSetas ? "hero-carousel__toolbar--no-arrows" : "",
    !opcoes.mostrarContador ? "hero-carousel__toolbar--no-counter" : "",
    !opcoes.mostrarDots ? "hero-carousel__toolbar--no-dots" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const classesControls = [
    "hero-carousel__controls",
    !contador ? "hero-carousel__controls--no-counter" : "",
    !setas ? "hero-carousel__controls--no-arrows" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `
    <div class="${classesToolbar}">
      ${progresso}
      <div class="${classesControls}">
        ${contador}
        ${setas ? `<span class="hero-carousel__nav">${setas}</span>` : ""}
      </div>
    </div>
  `;
}

function thumbsHtml(destaques, helpers, classeExtra = "") {
  const { escapeHtml, mediaNoticia } = helpers;
  return `
    <div class="hero-carousel__thumbs ${classeExtra}">
      ${destaques
        .map(
          (noticia, index) => `
        <button type="button" class="hero-carousel__thumb ${index === 0 ? "is-active" : ""}" data-go="${index}">
          <span class="hero-carousel__thumb-media">
            ${mediaNoticia(noticia, "hero-carousel__thumb-img", "hero-carousel__thumb-fallback")}
          </span>
          <span class="hero-carousel__thumb-copy">
            <span class="hero-carousel__thumb-kicker">${iconeNoticiaCarousel(noticia)}${escapeHtml(noticia.categoria || "Geral")}</span>
            <strong>${escapeHtml(noticia.titulo)}</strong>
          </span>
        </button>
      `,
        )
        .join("")}
    </div>
  `;
}

function montarCarrossel(modelo, destaques, opcoes, helpers) {
  const total = destaques.length;
  const slides = destaques
    .map((noticia, index) => {
      if (modelo === "split")
        return slideSplit(noticia, index, opcoes, helpers);
      return slideBase(noticia, index, opcoes, helpers);
    })
    .join("");

  const setasFlutuantes = opcoes.mostrarSetas
    ? `
    <div class="hero-carousel__floating-nav d-none d-md-flex">
      <button type="button" class="hero-carousel__btn-float prev" data-dir="prev" aria-label="Anterior">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <button type="button" class="hero-carousel__btn-float next" data-dir="next" aria-label="Próximo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    </div>
  `
    : "";

  const stage = `<div class="hero-carousel__stage">${slides}${setasFlutuantes}</div>`;

  if (modelo === "editorial") {
    const chrome = opcoes.mostrarMiniaturas
      ? `<div class="hero-carousel__chrome">${toolbarDots(destaques, total, opcoes)}${thumbsHtml(destaques, helpers)}</div>`
      : `<div class="hero-carousel__chrome hero-carousel__chrome--toolbar-only">${toolbarDots(destaques, total, opcoes)}</div>`;
    return `${stage}${chrome}`;
  }

  if (modelo === "fullscreen" || modelo === "card" || modelo === "gradient") {
    return `${stage}<div class="hero-carousel__overlay-ui">${toolbarDots(destaques, total, opcoes)}</div>`;
  }

  if (modelo === "compacto" || modelo === "bottom") {
    return `${stage}<div class="hero-carousel__footer-compact">${toolbarDots(destaques, total, opcoes)}</div>`;
  }

  if (modelo === "split") {
    return `${stage}<div class="hero-carousel__footer-compact">${toolbarDots(destaques, total, opcoes)}</div>`;
  }

  if (modelo === "filmstrip") {
    const faixa = opcoes.mostrarMiniaturas
      ? thumbsHtml(destaques, helpers, "hero-carousel__thumbs--strip")
      : "";
    return `${stage}<div class="hero-carousel__filmstrip-bar">${toolbarDots(destaques, total, opcoes)}${faixa}</div>`;
  }

  if (modelo === "magazine") {
    return `${stage}<div class="hero-carousel__magazine-ui">${toolbarDots(destaques, total, opcoes)}</div>`;
  }

  return `${stage}${toolbarDots(destaques, total, opcoes)}`;
}

function renderizarCarrosselPortal(section, destaques, config, helpers) {
  if (!section || !destaques.length) {
    if (section) section.innerHTML = "";
    return;
  }

  const opcoes = obterOpcoesCarrossel(config?.home || {});
  section.style.setProperty("--carousel-stage-min", `${opcoes.alturaPx}px`);
  const classesExtras = [
    !opcoes.mostrarSetas ? "hero-carousel--no-arrows" : "",
    !opcoes.mostrarContador ? "hero-carousel--no-counter" : "",
    !opcoes.mostrarDots ? "hero-carousel--no-dots" : "",
  ]
    .filter(Boolean)
    .join(" ");

  section.innerHTML = `
    <section
      class="hero-carousel hero-carousel--${opcoes.modelo} ${opcoes.classeTema} ${opcoes.classeAltura} ${classesExtras}"
      aria-label="Destaques do portal"
      data-autoplay="${opcoes.autoplay}"
      data-modelo="${opcoes.modelo}"
      data-camaleao="${opcoes.efeitoCamaleao}"
    >
      ${montarCarrossel(opcoes.modelo, destaques, opcoes, helpers)}
    </section>
  `;

  inicializarCarrosselPortal(section.querySelector(".hero-carousel"));
}

function inicializarCarrosselPortal(carousel) {
  if (!carousel || carousel.dataset.ready === "true") return;

  const slides = [...carousel.querySelectorAll(".hero-carousel__slide")];
  const dots = [...carousel.querySelectorAll(".hero-carousel__dot")];
  const thumbs = [...carousel.querySelectorAll(".hero-carousel__thumb")];
  const counter = carousel.querySelector(".hero-carousel__counter strong");
  const intervalo = Number(carousel.dataset.autoplay) || 6000;
  let indice = 0;
  let timer = null;
  const isCamaleao = carousel.dataset.camaleao === "true";

  carousel.style.setProperty("--hero-autoplay", `${intervalo}ms`);

  function irPara(novoIndice) {
    indice = (novoIndice + slides.length) % slides.length;
    slides.forEach((slide, i) =>
      slide.classList.toggle("is-active", i === indice),
    );
    dots.forEach((dot, i) => {
      const ativo = i === indice;
      dot.classList.toggle("is-active", ativo);
      if (ativo) {
        dot.classList.remove("is-animating");
        void dot.offsetWidth;
        dot.classList.add("is-animating");
      } else {
        dot.classList.remove("is-animating");
      }
    });
    thumbs.forEach((thumb, i) =>
      thumb.classList.toggle("is-active", i === indice),
    );
    if (counter) counter.textContent = String(indice + 1).padStart(2, "0");

    if (isCamaleao) {
      const currentImg = slides[indice]?.querySelector("img");
      if (currentImg) aplicarCamaleao(currentImg.src, carousel);
    }

    reiniciarTimer();
  }

  function reiniciarTimer() {
    if (timer) clearTimeout(timer);
    carousel.classList.remove("is-paused");
    timer = setTimeout(() => irPara(indice + 1), intervalo);
  }

  carousel.addEventListener("click", (event) => {
    const alvo = event.target.closest("[data-dir], [data-go]");
    if (!alvo || alvo.tagName === "A") return;
    if (alvo.dataset.dir === "prev") irPara(indice - 1);
    if (alvo.dataset.dir === "next") irPara(indice + 1);
    if (alvo.dataset.go !== undefined) irPara(Number(alvo.dataset.go));
  });

  carousel.addEventListener("mouseenter", () => {
    carousel.classList.add("is-paused");
    if (timer) clearTimeout(timer);
  });

  carousel.addEventListener("mouseleave", reiniciarTimer);

  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") irPara(indice - 1);
    if (event.key === "ArrowRight") irPara(indice + 1);
  });

  // --- Suporte a Swipe (Arrasto) no Mobile ---
  let touchStartX = 0;
  let touchEndX = 0;

  carousel.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].screenX;
      carousel.classList.add("is-paused");
      if (timer) clearTimeout(timer);
    },
    { passive: true },
  );

  carousel.addEventListener(
    "touchend",
    (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 40) {
        // Limite mínimo de 40px para reconhecer como arrasto
        if (diff > 0) {
          irPara(indice + 1); // Deslizou para a esquerda (Avançar slide)
        } else {
          irPara(indice - 1); // Deslizou para a direita (Voltar slide)
        }
      }
      reiniciarTimer();
    },
    { passive: true },
  );

  carousel.setAttribute("tabindex", "0");
  carousel.dataset.ready = "true";
  dots[indice]?.classList.add("is-animating");

  if (isCamaleao) {
    const initImg = slides[indice]?.querySelector("img");
    if (initImg) aplicarCamaleao(initImg.src, carousel);
  }

  reiniciarTimer();
}

/* --- EFEITO CAMALEÃO (Extração dinâmica de cores) --- */
function aplicarCamaleao(src, carousel) {
  if (!src) return;
  const cacheKey = "camaleao_" + btoa(src).substring(0, 20);
  if (carousel[cacheKey]) {
    setarCamaleao(carousel, carousel[cacheKey]);
    return;
  }
  const img = new Image();
  img.crossOrigin = "Anonymous";
  img.onload = () => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = 60;
      canvas.height = 60;
      ctx.drawImage(img, 0, 0, 60, 60);
      const data = ctx.getImageData(0, 0, 60, 60).data;
      let r = 0,
        g = 0,
        b = 0,
        count = 0;
      for (let i = 0; i < data.length; i += 16) {
        if (data[i + 3] < 255) continue; // Ignora transparência
        if (
          (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) ||
          (data[i] < 15 && data[i + 1] < 15 && data[i + 2] < 15)
        )
          continue; // Ignora excesso de branco/preto
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
      }
      if (count > 0) {
        const cor = `rgb(${Math.floor(r / count)}, ${Math.floor(g / count)}, ${Math.floor(b / count)})`;
        carousel[cacheKey] = cor;
        setarCamaleao(carousel, cor);
      }
    } catch (e) {} // Ignora falhas de CORS em domínios estritos
  };
  img.src = src;
}

function setarCamaleao(carousel, cor) {
  carousel.style.transition =
    "background-color 1.2s ease, box-shadow 1.2s ease, border-color 1.2s ease";
  if (carousel.classList.contains("hero-carousel--light")) {
    carousel.style.backgroundColor = `color-mix(in srgb, ${cor} 10%, #ffffff)`;
    carousel.style.boxShadow = `0 18px 50px color-mix(in srgb, ${cor} 25%, transparent)`;
  } else {
    carousel.style.backgroundColor = `color-mix(in srgb, ${cor} 15%, #0a0a0a)`;
    carousel.style.boxShadow = `0 18px 50px color-mix(in srgb, ${cor} 20%, transparent)`;
    const stage = carousel.querySelector(".hero-carousel__stage");
    if (stage) {
      stage.style.transition = "background-color 1.2s ease";
      stage.style.backgroundColor = `color-mix(in srgb, ${cor} 25%, #111111)`;
    }
  }
}

const form = document.getElementById("form-noticia");
const lista = document.getElementById("lista-admin-noticias");
const btnCancelar = document.getElementById("btn-cancelar");
const btnSubmit = document.getElementById("btn-submit");
const tituloForm = document.getElementById("titulo-form");
const inputImagem = document.getElementById("imagem");
const inputImagemUrl = document.getElementById("imagemUrl");
const previewImagem = document.getElementById("preview-imagem");
const btnRemoverImagem = document.getElementById("btn-remover-imagem");
const removerImagem = document.getElementById("remover-imagem");
const conteudoCampo = document.getElementById("conteudo");
const conteudoEditor = document.getElementById("conteudo-editor");
const editorToolbar = document.getElementById("editor-toolbar");
let fonteImagemAtual = "upload";

const formEnquete = document.getElementById("form-enquete");
const formJogo = document.getElementById("form-jogo");
const btnCancelarJogo = document.getElementById("btn-cancelar-jogo");
const formConfig = document.getElementById("form-config");
const formOdds = document.getElementById("form-odds");
const formPortais = document.getElementById("form-portais");
const formTabela = document.getElementById("form-tabela");
const btnCancelarTabela = document.getElementById("btn-cancelar-tabela");

const formPatrocinador = document.getElementById("form-patrocinador");
const btnCancelarPatrocinador = document.getElementById(
  "btn-cancelar-patrocinador",
);

const formVideo = document.getElementById("form-video");
const btnCancelarVideo = document.getElementById("btn-cancelar-video");

const formAutor = document.getElementById("form-autor");
const btnCancelarAutor = document.getElementById("btn-cancelar-autor");

const formUsuario = document.getElementById("form-usuario");
const btnCancelarUsuario = document.getElementById("btn-cancelar-usuario");

let noticiasCache = [];
let jogosCache = [];
let patrocinadoresCache = [];
let videosCache = [];
let configCache = null;
let carrosselSelecionados = [];
let autoresCache = [];
let noticiasCarrosselCache = [];
let usuariosCache = [];
let tabelasCache = [];
let currentUser = null;
let ordemWidgetsAtual = [
  "maisLidas",
  "jogos",
  "enquete",
  "tabela",
  "odds",
  "videos",
  "twitter",
  "portais",
];

const CASAS_DE_APOSTA = [
  "Betano",
  "Bet365",
  "Sportingbet",
  "1xBet",
  "Betfair",
  "Pinnacle",
  "KTO",
  "Betsson",
  "Superbet",
  "EstrelaBet",
  "Novibet",
  "VBET",
  "Pixbet",
  "Betnacional",
  "Esportes da Sorte",
  "F12.bet",
  "Aposta Ganha",
  "Brazino777",
  "Rivalo",
];

const TODOS_PORTAIS = [
  "FOGÃONET",
  "GLOBO ESPORTE",
  "UOL ESPORTE",
  "LANCE!",
  "OGOL",
  "O DIA",
  "ESPN BRASIL",
  "TNT SPORTS",
  "365SCORES",
];

const ESCUDOS_AUTO_COMPLETE = {
  BOT: "/escudos/botafogo.svg",
  FLA: "/escudos/flamengo.svg",
  FLU: "/escudos/fluminense.png",
  VAS: "/escudos/vasco.svg",
  SAO: "/escudos/sao-paulo.png",
  PAL: "/escudos/palmeiras.png",
  COR: "/escudos/corinthians.svg",
  SAN: "/escudos/santos.png",
  CAM: "/escudos/atletico-mg.svg",
  CRU: "/escudos/cruzeiro.svg",
  INT: "/escudos/internacional.png",
  GRE: "/escudos/gremio.png",
  BAH: "/escudos/bahia.png",
  VIT: "/escudos/vitoria.svg",
  FOR: "/escudos/fortaleza.svg",
  CEA: "/escudos/ceara.svg",
  CAP: "/escudos/athletico-pr.svg",
  RBB: "/escudos/bragantino.svg",
  JUV: "/escudos/juventude.svg",
  CRI: "/escudos/criciuma.png",
  CUI: "/escudos/cuiaba.png",
  ACG: "/escudos/atletico-go.svg",
  SPO: "/escudos/sport.png",
  GOI: "/escudos/goias.svg",
  CFC: "/escudos/coritiba.png",
  AME: "/escudos/america-mg.svg",
  GUA: "/escudos/guarani.png",
  PON: "/escudos/ponte-preta.svg",
  VIL: "/escudos/vila-nova.png",
  CRB: "/escudos/crb.png",
  NOV: "/escudos/novorizontino.png",
  OPE: "/escudos/operario.svg",
  AVA: "/escudos/avai.svg",
  CHA: "/escudos/chapecoense.svg",
  MIR: "/escudos/mirassol.png",
  REM: "/escudos/remo.svg",
  PAY: "/escudos/paysandu.svg",
  AMA: "/escudos/amazonas.svg",
  ITU: "/escudos/ituano.png",
  BSP: "/escudos/botafogo-sp.svg",
};

const HOME_SWITCH_IDS = [
  "mostrarBusca",
  "mostrarCarrossel",
  "mostrarUltimas",
  "mostrarMaisLidas",
  "mostrarJogos",
  "mostrarEnquete",
  "mostrarTabela",
  "mostrarOdds",
  "mostrarVideos",
  "mostrarTwitter",
  "mostrarPortais",
];

function mostrarToast(mensagem, tipo = "success") {
  let toastEl = document.getElementById("premium-toast-dinamico");
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.id = "premium-toast-dinamico";
    document.body.appendChild(toastEl);
  }

  const icon =
    tipo === "success"
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';

  toastEl.className = `premium-toast ${tipo === "danger" ? "danger" : ""}`;
  toastEl.innerHTML = `${icon} <span>${escapeHtml(mensagem)}</span>`;

  void toastEl.offsetWidth; // Força reflow da animação
  toastEl.classList.add("show");

  if (window.toastTimeout) clearTimeout(window.toastTimeout);
  window.toastTimeout = setTimeout(() => {
    toastEl.classList.remove("show");
  }, 3500);
}

document.addEventListener("DOMContentLoaded", async () => {
  // Injeta checkboxes ocultos para chaves de layout dinâmicas que não existem no HTML fixo do painel
  HOME_SWITCH_IDS.forEach((id) => {
    if (!document.getElementById(id)) {
      const input = document.createElement("input");
      input.type = "checkbox";
      input.id = id;
      input.style.display = "none";
      document.body.appendChild(input);
    }
  });

  // Busca e aplica o nível de permissão (Role) do usuário logado
  try {
    const resStatus = await fetch("/api/status");
    const statusData = await resStatus.json();
    currentUser = statusData.user;
    aplicarPermissoes(currentUser);
  } catch (e) {}

  inicializarEditorTexto();
  inicializarFonteImagem();
  carregarConfigAdmin();
  carregarListaAdmin();
  carregarEnqueteAdmin();
  carregarJogosAdmin();
  carregarPatrocinadoresAdmin();
  carregarVideosAdmin();
  carregarAutoresAdmin();
  carregarTabelasAdmin();
  iniciarAutoSave();
  carregarTwitterAdmin();
  HOME_SWITCH_IDS.forEach((id) => {
    document.getElementById(id)?.addEventListener("change", (e) => {
      const widgetSwitch = document.querySelector(
        `.sync-widget-switch[data-sync="${id}"]`,
      );
      if (widgetSwitch) widgetSwitch.checked = e.target.checked;
      renderizarPreviewLayout();
    });
  });

  // Monitoramento da barra flutuante de configurações
  const formConfigAdmin = document.getElementById("form-config");
  if (formConfigAdmin) {
    const mostrarBarraSalvar = () =>
      document.querySelector(".admin-sticky-bar")?.classList.add("is-visible");
    formConfigAdmin.addEventListener("input", mostrarBarraSalvar);
    formConfigAdmin.addEventListener("change", mostrarBarraSalvar);

    // Integração com mover botões (Carrossel e Widgets)
    document
      .getElementById("carrossel-disponiveis")
      ?.addEventListener("click", mostrarBarraSalvar);
    document
      .getElementById("carrossel-selecionados")
      ?.addEventListener("click", mostrarBarraSalvar);
    document
      .getElementById("widgets-admin-grid")
      ?.addEventListener("click", mostrarBarraSalvar);
  }
  document
    .getElementById("temaCarrossel")
    ?.addEventListener("change", renderizarPreviewLayout);
  document
    .getElementById("alturaCarrossel")
    ?.addEventListener("change", renderizarPreviewLayout);
  document
    .getElementById("autoplayCarrossel")
    ?.addEventListener("change", renderizarPreviewLayout);
  document
    .getElementById("mostrarResumoCarrossel")
    ?.addEventListener("change", renderizarPreviewLayout);
  document
    .getElementById("mostrarMiniaturasCarrossel")
    ?.addEventListener("change", renderizarPreviewLayout);
  [
    "mostrarDotsCarrossel",
    "mostrarContadorCarrossel",
    "mostrarSetasCarrossel",
    "efeitoCamaleao",
  ].forEach((id) => {
    document
      .getElementById(id)
      ?.addEventListener("change", renderizarPreviewLayout);
  });
  montarGradeModelosCarrossel();
  montarFormularioWidgetsAdmin();
  document.getElementById("limiteCarrossel")?.addEventListener("change", () => {
    ajustarLimiteCarrossel();
    renderizarSeletorCarrossel();
    renderizarPreviewLayout();
  });
  document
    .getElementById("carrossel-busca")
    ?.addEventListener("input", renderizarSeletorCarrossel);
  document
    .getElementById("carrossel-selecionados")
    ?.addEventListener("click", tratarCliqueCarrossel);
  document
    .getElementById("carrossel-disponiveis")
    ?.addEventListener("click", tratarCliqueCarrossel);

  document.getElementById("modoVideos")?.addEventListener("change", (e) => {
    document
      .getElementById("grupo-youtube-auto")
      .classList.toggle("d-none", e.target.value === "manual");
  });

  document
    .getElementById("busca-noticias-admin")
    ?.addEventListener("input", aplicarFiltrosTabelaNoticias);
  document
    .getElementById("filtro-portal-admin")
    ?.addEventListener("change", aplicarFiltrosTabelaNoticias);

  document
    .getElementById("busca-jogos-admin")
    ?.addEventListener("input", (e) => {
      const termo = e.target.value.toLowerCase();
      document
        .querySelectorAll("#lista-jogos-admin .admin-game-row")
        .forEach((row) => {
          const texto = row.textContent.toLowerCase();
          row.style.display = texto.includes(termo) ? "" : "none";
        });
    });

  // Atalho de Teclado (PRO)
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      const isConfigVisible = document
        .getElementById("pane-config")
        ?.classList.contains("show");
      if (isConfigVisible) {
        e.preventDefault();
        document
          .getElementById("form-config")
          ?.dispatchEvent(
            new Event("submit", { cancelable: true, bubbles: true }),
          );
      }
    }
  });

  const datalist = document.getElementById("lista-clubes");
  if (datalist) {
    datalist.innerHTML = Object.keys(ESCUDOS_AUTO_COMPLETE)
      .map((sigla) => `<option value="${sigla}">`)
      .join("");
  }

  document.getElementById("mandante")?.addEventListener("input", (e) => {
    const sigla = e.target.value.trim().toUpperCase();
    if (ESCUDOS_AUTO_COMPLETE[sigla]) {
      const inputEscudo = document.getElementById("escudoMandante");
      if (inputEscudo) inputEscudo.value = ESCUDOS_AUTO_COMPLETE[sigla];
    }
  });
  document.getElementById("visitante")?.addEventListener("input", (e) => {
    const sigla = e.target.value.trim().toUpperCase();
    if (ESCUDOS_AUTO_COMPLETE[sigla]) {
      const inputEscudo = document.getElementById("escudoVisitante");
      if (inputEscudo) inputEscudo.value = ESCUDOS_AUTO_COMPLETE[sigla];
    }
  });
});

function aplicarPermissoes(user) {
  if (!user) return;

  // Define quem pode ver quais abas do Admin
  const tabs = {
    "nav-item-dashboard": ["super_admin"],
    "nav-item-config": ["super_admin", "admin"],
    "nav-item-noticias": ["super_admin", "admin", "usuario"],
    "nav-item-noticias-lista": ["super_admin", "admin", "usuario"],
    "nav-item-enquete": ["super_admin", "admin", "usuario"],
    "nav-item-portais": ["super_admin", "admin"],
    "nav-item-tabelas": ["super_admin", "admin"],
    "nav-item-odds": ["super_admin", "admin"],
    "nav-item-jogos": ["super_admin", "admin"],
    "nav-item-patrocinadores": ["super_admin", "admin"],
    "nav-item-videos": ["super_admin", "admin"],
    "nav-item-twitter": ["super_admin", "admin"],
    "nav-item-autores": ["super_admin", "admin"],
    "nav-item-usuarios": ["super_admin"],
    "nav-item-rss": ["super_admin", "admin", "usuario"],
  };

  let firstActiveTab = null;

  Object.keys(tabs).forEach((tabId) => {
    const el = document.getElementById(tabId);
    if (el) {
      if (tabs[tabId].includes(user.role)) {
        el.classList.remove("d-none");
        if (!firstActiveTab) firstActiveTab = el.querySelector("button");
      } else {
        el.classList.add("d-none");
      }
    }
  });

  // Garante que o painel inicie focado em uma aba que a pessoa tenha permissão para ver
  const activeBtn = document.querySelector(".nav-link.active");
  const activeLi = activeBtn?.closest(".nav-item");
  if (activeLi && activeLi.classList.contains("d-none") && firstActiveTab) {
    firstActiveTab.click();
  }

  if (user.role === "super_admin") carregarUsuariosAdmin();
}

function aplicarFiltrosTabelaNoticias() {
  const termo = (
    document.getElementById("busca-noticias-admin")?.value || ""
  ).toLowerCase();
  const tipo = document.getElementById("filtro-portal-admin")?.value || "todos";

  const containerPortais = document.getElementById("filtros-rss-portais");
  if (containerPortais) {
    if (tipo === "rss") {
      containerPortais.classList.remove("d-none");
    } else {
      containerPortais.classList.add("d-none");
    }
  }

  const portaisSelecionados = Array.from(
    document.querySelectorAll(".chk-filtro-portal:checked"),
  ).map((chk) => chk.value);

  document
    .querySelectorAll("#lista-admin-noticias tr.noticia-row")
    .forEach((row) => {
      const texto = row.textContent.toLowerCase();
      const rowTipo = row.dataset.tipo;
      const rowPortal = row.dataset.portal || "";
      const bateTexto = texto.includes(termo);
      let bateTipo = tipo === "todos" || tipo === rowTipo;

      if (bateTipo && tipo === "rss" && portaisSelecionados.length > 0) {
        if (!portaisSelecionados.includes(rowPortal)) {
          bateTipo = false;
        }
      }

      row.style.display = bateTexto && bateTipo ? "" : "none";
    });
}

form.addEventListener("submit", salvarNoticia);
btnCancelar.addEventListener("click", limparFormulario);
inputImagem.addEventListener("change", atualizarPreviewArquivo);
inputImagemUrl?.addEventListener("input", atualizarPreviewUrl);
btnRemoverImagem.addEventListener("click", marcarImagemParaRemocao);
formEnquete.addEventListener("submit", salvarEnquete);
formJogo.addEventListener("submit", salvarJogo);
btnCancelarJogo.addEventListener("click", limparFormularioJogo);
formTabela?.addEventListener("submit", salvarTabela);
btnCancelarTabela?.addEventListener("click", limparFormularioTabela);
formConfig.addEventListener("submit", salvarConfig);
formOdds?.addEventListener("submit", salvarConfig);
formPortais?.addEventListener("submit", salvarConfig);
formPatrocinador?.addEventListener("submit", salvarPatrocinador);
btnCancelarPatrocinador?.addEventListener(
  "click",
  limparFormularioPatrocinador,
);
formVideo?.addEventListener("submit", salvarVideo);
btnCancelarVideo?.addEventListener("click", limparFormularioVideo);
formAutor?.addEventListener("submit", salvarAutor);
btnCancelarAutor?.addEventListener("click", limparFormularioAutor);

formUsuario?.addEventListener("submit", salvarUsuario);
btnCancelarUsuario?.addEventListener("click", limparFormularioUsuario);

document
  .getElementById("form-twitter")
  ?.addEventListener("submit", salvarTwitter);
document
  .getElementById("btn-cancelar-twitter")
  ?.addEventListener("click", limparFormularioTwitter);

document.getElementById("video-link")?.addEventListener("input", (e) => {
  const url = e.target.value;
  const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/);
  if (match && match[1]) {
    const vid = match[1];
    const thumbUrl = `https://img.youtube.com/vi/${vid}/maxresdefault.jpg`;
    document.getElementById("video-thumbnail").value = thumbUrl;
    document.getElementById("preview-video-thumb").innerHTML =
      `<img src="${thumbUrl}" class="img-fluid rounded shadow-sm">`;
    document.getElementById("preview-video-thumb").classList.remove("d-none");
  }
});

document
  .getElementById("logo")
  .addEventListener("change", () =>
    previewArquivo("logo", "preview-logo", "btn-remover-logo", "remover-logo"),
  );
document
  .getElementById("favicon")
  ?.addEventListener("change", () =>
    previewArquivo(
      "favicon",
      "preview-favicon",
      "btn-remover-favicon",
      "remover-favicon",
    ),
  );
document.getElementById("faviconUrl")?.addEventListener("input", () => {
  const url = document.getElementById("faviconUrl")?.value.trim();
  if (!url) return;
  document.getElementById("remover-favicon").value = "false";
  mostrarPreviewGenerico(
    "preview-favicon",
    "btn-remover-favicon",
    url,
    "Favicon",
  );
});
document
  .getElementById("bannerMarca")
  .addEventListener("change", () =>
    previewArquivo(
      "bannerMarca",
      "preview-banner-marca",
      "btn-remover-banner-marca",
      "remover-banner-marca",
    ),
  );
document
  .getElementById("bannerMarcaUrl")
  .addEventListener("input", previewBannerUrl);
document
  .getElementById("imagemPadrao")
  .addEventListener("change", () =>
    previewArquivo(
      "imagemPadrao",
      "preview-imagem-padrao",
      "btn-remover-imagem-padrao",
      "remover-imagem-padrao",
    ),
  );
document
  .getElementById("btn-remover-logo")
  .addEventListener("click", () =>
    removerPreview("logo", "preview-logo", "btn-remover-logo", "remover-logo"),
  );
document
  .getElementById("btn-remover-favicon")
  ?.addEventListener("click", () => {
    removerPreview(
      "favicon",
      "preview-favicon",
      "btn-remover-favicon",
      "remover-favicon",
    );
    const urlInp = document.getElementById("faviconUrl");
    if (urlInp) urlInp.value = "";
  });
document
  .getElementById("btn-remover-banner-marca")
  .addEventListener("click", () => {
    removerPreview(
      "bannerMarca",
      "preview-banner-marca",
      "btn-remover-banner-marca",
      "remover-banner-marca",
    );
    const urlBanner = document.getElementById("bannerMarcaUrl");
    if (urlBanner) urlBanner.value = "";
  });
document
  .getElementById("btn-remover-imagem-padrao")
  .addEventListener("click", () =>
    removerPreview(
      "imagemPadrao",
      "preview-imagem-padrao",
      "btn-remover-imagem-padrao",
      "remover-imagem-padrao",
    ),
  );
document
  .getElementById("modoMarca")
  ?.addEventListener("change", atualizarAjudaMarca);
document
  .getElementById("alturaBannerMarca")
  ?.addEventListener("input", (event) => {
    document.getElementById("altura-banner-valor").textContent =
      event.target.value;
  });
document.getElementById("logoTremor")?.addEventListener("input", (event) => {
  const val = event.target.value;
  const el = document.getElementById("logo-tremor-valor");
  if (el) el.textContent = val;
  document.documentElement.style.setProperty("--logo-shake-px", `${val}px`);
  document.documentElement.style.setProperty(
    "--logo-shake-deg",
    `${val / 2}deg`,
  );

  const previewImg = document.querySelector("#preview-logo img");
  if (previewImg) {
    previewImg.style.animation = "none";
    void previewImg.offsetWidth; // Força o reflow para reiniciar a animação
    previewImg.style.animation =
      "var(--logo-anim-hover, logoShakeHover) 0.8s cubic-bezier(0.36, 0.07, 0.19, 0.97) both";
  }
});
document.getElementById("logoEfeito")?.addEventListener("change", (event) => {
  const val = event.target.value;
  const animHover =
    val === "none"
      ? "none"
      : `logo${val.charAt(0).toUpperCase() + val.slice(1)}Hover`;
  document.documentElement.style.setProperty("--logo-anim-hover", animHover);

  // Feedback visual imediato na imagem de preview da logo
  const previewImg = document.querySelector("#preview-logo img");
  if (previewImg) {
    previewImg.style.animation = "none";
    void previewImg.offsetWidth; // Força o reflow para reiniciar a animação
    previewImg.style.animation =
      "var(--logo-anim-hover, logoShakeHover) 0.8s cubic-bezier(0.36, 0.07, 0.19, 0.97) both";
  }
});
document
  .getElementById("buscaImagemAltura")
  ?.addEventListener("input", (event) => {
    document.getElementById("busca-imagem-altura-valor").textContent =
      event.target.value;
  });
document.getElementById("buscaLargura")?.addEventListener("input", (event) => {
  document.getElementById("busca-largura-valor").textContent =
    event.target.value;
});
document
  .getElementById("buscaPaddingVertical")
  ?.addEventListener("input", (event) => {
    document.getElementById("busca-padding-valor").textContent =
      event.target.value;
  });
document
  .getElementById("patrocinadoresAltura")
  ?.addEventListener("input", (event) => {
    const el = document.getElementById("patrocinadores-altura-valor");
    if (el) el.textContent = event.target.value;
  });
document
  .getElementById("patrocinadoresVelocidade")
  ?.addEventListener("input", (event) => {
    const el = document.getElementById("patrocinadores-velocidade-valor");
    if (el) el.textContent = event.target.value;
  });
document
  .getElementById("tamanhoFotoAutor")
  ?.addEventListener("input", (event) => {
    const el = document.getElementById("tamanho-foto-autor-valor");
    if (el) el.textContent = event.target.value;
  });
document
  .getElementById("patrocinador-tipo")
  ?.addEventListener("change", (e) => {
    const boxImagem = document.getElementById("box-imagem-patrocinador");
    e.target.value === "imagem"
      ? boxImagem.classList.remove("d-none")
      : boxImagem.classList.add("d-none");
  });
document
  .getElementById("patrocinador-imagem")
  ?.addEventListener("change", (e) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    document.getElementById("remover-imagem-patrocinador").value = "false";
    mostrarPreviewPatrocinador(URL.createObjectURL(arquivo));
  });
document
  .getElementById("btn-remover-imagem-patrocinador")
  ?.addEventListener("click", () => {
    document.getElementById("patrocinador-imagem").value = "";
    document.getElementById("remover-imagem-patrocinador").value = "true";
    esconderPreviewPatrocinador();
  });

document.getElementById("autor-imagem")?.addEventListener("change", (e) => {
  const arquivo = e.target.files?.[0];
  if (!arquivo) return;
  document.getElementById("remover-imagem-autor").value = "false";
  const preview = document.getElementById("preview-autor-imagem");
  const btnRemover = document.getElementById("btn-remover-imagem-autor");
  preview.innerHTML = `<img src="${URL.createObjectURL(arquivo)}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 50%;" class="shadow-sm">`;
  preview.classList.remove("d-none");
  btnRemover.classList.remove("d-none");
});
document
  .getElementById("btn-remover-imagem-autor")
  ?.addEventListener("click", () => {
    document.getElementById("autor-imagem").value = "";
    document.getElementById("remover-imagem-autor").value = "true";
    document.getElementById("preview-autor-imagem").classList.add("d-none");
    document.getElementById("btn-remover-imagem-autor").classList.add("d-none");
  });

document.getElementById("imagem-enquete")?.addEventListener("change", (e) => {
  const arquivo = e.target.files?.[0];
  if (!arquivo) return;
  document.getElementById("remover-imagem-enquete").value = "false";
  mostrarPreviewEnquete(URL.createObjectURL(arquivo));
});

document
  .getElementById("btn-remover-imagem-enquete")
  ?.addEventListener("click", () => {
    document.getElementById("imagem-enquete").value = "";
    document.getElementById("remover-imagem-enquete").value = "true";
    esconderPreviewEnquete();
  });

function mostrarPreviewEnquete(src) {
  const preview = document.getElementById("preview-imagem-enquete");
  const btnRemover = document.getElementById("btn-remover-imagem-enquete");
  preview.innerHTML = `<img src="${src}" style="max-height: 180px; w-100 object-fit: cover; border-radius: 4px;" alt="Banner Enquete">`;
  preview.classList.remove("d-none");
  btnRemover.classList.remove("d-none");
}

function esconderPreviewEnquete() {
  const preview = document.getElementById("preview-imagem-enquete");
  const btnRemover = document.getElementById("btn-remover-imagem-enquete");
  preview.innerHTML = "";
  preview.classList.add("d-none");
  btnRemover.classList.add("d-none");
}

document.querySelectorAll("[data-fundo-header]").forEach((botao) => {
  botao.addEventListener("click", () =>
    alternarFundoHeader(botao.dataset.fundoHeader),
  );
});
document
  .getElementById("fundoSiteTipo")
  ?.addEventListener("change", alternarFundoSite);
document.getElementById("fundoHeader")?.addEventListener("change", () => {
  previewArquivo(
    "fundoHeader",
    "preview-fundo-header",
    "btn-remover-fundo-header",
    "remover-fundo-header",
  );
  alternarFundoHeader("imagem");
  aplicarTemaPortal(lerTemaPreview());
});
document
  .getElementById("fundoHeaderUrl")
  ?.addEventListener("input", previewFundoHeaderUrl);
document.getElementById("fundoSite")?.addEventListener("change", () => {
  previewArquivo(
    "fundoSite",
    "preview-fundo-site",
    "btn-remover-fundo-site",
    "remover-fundo-site",
  );
  document.getElementById("fundoSiteTipo").value = "imagem";
  alternarFundoSite();
  aplicarTemaPortal(lerTemaPreview());
});
document
  .getElementById("fundoSiteUrl")
  ?.addEventListener("input", previewFundoSiteUrl);
document
  .getElementById("btn-remover-fundo-header")
  ?.addEventListener("click", () => {
    removerPreview(
      "fundoHeader",
      "preview-fundo-header",
      "btn-remover-fundo-header",
      "remover-fundo-header",
    );
    document.getElementById("fundoHeaderUrl").value = "";
  });
document
  .getElementById("btn-remover-fundo-site")
  ?.addEventListener("click", () => {
    removerPreview(
      "fundoSite",
      "preview-fundo-site",
      "btn-remover-fundo-site",
      "remover-fundo-site",
    );
    document.getElementById("fundoSiteUrl").value = "";
  });
document
  .getElementById("fundoHeaderOverlay")
  ?.addEventListener("input", (event) => {
    document.getElementById("fundo-header-overlay-valor").textContent =
      event.target.value;
  });
document
  .getElementById("fundoSiteOverlay")
  ?.addEventListener("input", (event) => {
    document.getElementById("fundo-site-overlay-valor").textContent =
      event.target.value;
  });
document
  .getElementById("fundoHeaderCor")
  ?.addEventListener("input", () => aplicarTemaPortal(lerTemaPreview()));
document
  .getElementById("corPrincipal")
  ?.addEventListener("input", () => aplicarTemaPortal(lerTemaPreview()));
document
  .getElementById("corAcento")
  ?.addEventListener("input", () => aplicarTemaPortal(lerTemaPreview()));

async function carregarConfigAdmin() {
  const resposta = await fetch("/api/config");
  configCache = await resposta.json();
  document.getElementById("nomePortal").value = configCache.nomePortal || "";
  document.getElementById("slogan").value = configCache.slogan || "";
  document.getElementById("corPrincipal").value =
    configCache.corPrincipal || "#262626";
  document.getElementById("corAcento").value =
    configCache.corAcento || "#0f766e";

  const inputLimiteNoticias = document.getElementById("limiteNoticias");
  if (inputLimiteNoticias) {
    inputLimiteNoticias.value = configCache.home?.limiteNoticias || 6;
    inputLimiteNoticias.setAttribute("max", "100"); // Remove a trava rígida de 24 e permite até 100
  }

  const inputLogoEfeito = document.getElementById("logoEfeito");
  if (inputLogoEfeito) {
    inputLogoEfeito.value = configCache.logoEfeito || "shake";
  }

  document.getElementById("limiteJogos").value =
    configCache.home?.limiteJogos || 3;
  document.getElementById("limiteCarrossel").value =
    configCache.home?.limiteCarrossel || 5;

  const inputLimiteVideos = document.getElementById("limiteVideos");
  if (inputLimiteVideos)
    inputLimiteVideos.value = configCache.home?.limiteVideos || 3;
  const inputYoutubeId = document.getElementById("youtubeChannelId");
  if (inputYoutubeId) inputYoutubeId.value = configCache.youtubeChannelId || "";
  const inputModoVideos = document.getElementById("modoVideos");
  if (inputModoVideos)
    inputModoVideos.value = configCache.home?.modoVideos || "auto";
  const inputTextoVideo = document.getElementById("textoBotaoVideo");
  if (inputTextoVideo)
    inputTextoVideo.value = configCache.home?.textoBotaoVideo || "";
  const inputVideosCorBotao = document.getElementById("videosCorBotao");
  if (inputVideosCorBotao)
    inputVideosCorBotao.value = configCache.home?.videosCorBotao || "#dc3545";
  const inputVideosIntervalo = document.getElementById("videosIntervalo");
  if (inputVideosIntervalo)
    inputVideosIntervalo.value = configCache.home?.videosIntervalo ?? 5;
  const inputVideosProporcao = document.getElementById("videosProporcao");
  if (inputVideosProporcao)
    inputVideosProporcao.value = configCache.home?.videosProporcao || "16/9";
  document
    .getElementById("grupo-youtube-auto")
    ?.classList.toggle(
      "d-none",
      (configCache.home?.modoVideos || "auto") === "manual",
    );

  const inputLimiteRss = document.getElementById("limiteRss");
  if (inputLimiteRss) {
    inputLimiteRss.value = configCache.home?.limiteRss ?? 15;
    inputLimiteRss.setAttribute("max", "100"); // Permite ajustar até 100 itens no admin
  }
  document.getElementById("temaCarrossel").value =
    configCache.home?.temaCarrossel === "escuro" ? "escuro" : "claro";
  document.getElementById("modeloCarrossel").value =
    configCache.home?.modeloCarrossel || "editorial";
  document.getElementById("alturaCarrossel").value =
    configCache.home?.alturaCarrossel || "medio";
  document.getElementById("autoplayCarrossel").value =
    configCache.home?.autoplayCarrossel || 6;
  document.getElementById("mostrarResumoCarrossel").checked =
    configCache.home?.mostrarResumoCarrossel !== false;
  document.getElementById("mostrarMiniaturasCarrossel").checked =
    configCache.home?.mostrarMiniaturasCarrossel !== false;

  document.getElementById("mostrarDotsCarrossel").checked =
    configCache.home?.mostrarDotsCarrossel !== false;
  document.getElementById("mostrarContadorCarrossel").checked =
    configCache.home?.mostrarContadorCarrossel !== false;
  document.getElementById("mostrarSetasCarrossel").checked =
    configCache.home?.mostrarSetasCarrossel !== false;

  if (document.getElementById("efeitoCamaleao")) {
    document.getElementById("efeitoCamaleao").checked =
      configCache.home?.efeitoCamaleao === true;
  }

  const chkAutoRss = document.getElementById("carrosselAutoRss");
  if (chkAutoRss) {
    chkAutoRss.checked = configCache.home?.carrosselAutoRss === true;
    const painelSelecao = document.getElementById("painel-selecao-carrossel");
    if (painelSelecao) {
      painelSelecao.style.opacity = chkAutoRss.checked ? "0.5" : "1";
      painelSelecao.style.pointerEvents = chkAutoRss.checked ? "none" : "auto";
    }

    chkAutoRss.addEventListener("change", (e) => {
      if (painelSelecao) {
        painelSelecao.style.opacity = e.target.checked ? "0.5" : "1";
        painelSelecao.style.pointerEvents = e.target.checked ? "none" : "auto";
      }
      renderizarPreviewLayout();
    });
  }

  if (document.getElementById("buscaTitulo"))
    document.getElementById("buscaTitulo").value =
      configCache.buscaTitulo || "Explore o portal";
  if (document.getElementById("buscaSubtitulo"))
    document.getElementById("buscaSubtitulo").value =
      configCache.buscaSubtitulo || "busque por titulo, assunto ou categoria";
  if (document.getElementById("buscaPlaceholder"))
    document.getElementById("buscaPlaceholder").value =
      configCache.buscaPlaceholder ||
      "Pesquisar notícias, categorias ou autores...";
  preencherFormularioWidgetsAdmin(configCache);
  document.getElementById("modoMarca").value = configCache.modoMarca || "texto";
  document.getElementById("alturaBannerMarca").value =
    configCache.alturaBannerMarca || 52;
  document.getElementById("altura-banner-valor").textContent =
    configCache.alturaBannerMarca || 52;

  const inputLogoTremor = document.getElementById("logoTremor");
  if (inputLogoTremor) {
    const valTremor =
      configCache.logoTremor !== undefined ? configCache.logoTremor : 4;
    inputLogoTremor.value = valTremor;
    const spanTremor = document.getElementById("logo-tremor-valor");
    if (spanTremor) spanTremor.textContent = valTremor;
    document.documentElement.style.setProperty(
      "--logo-shake-px",
      `${valTremor}px`,
    );
    document.documentElement.style.setProperty(
      "--logo-shake-deg",
      `${valTremor / 2}deg`,
    );
    const efeito = configCache.logoEfeito || "shake";
    const animHover =
      efeito === "none"
        ? "none"
        : `logo${efeito.charAt(0).toUpperCase() + efeito.slice(1)}Hover`;
    document.documentElement.style.setProperty("--logo-anim-hover", animHover);
  }
  document.getElementById("mostrarTextoMarca").checked =
    configCache.mostrarTextoMarca !== false;
  if (configCache.bannerMarcaUrl) {
    document.getElementById("bannerMarcaUrl").value = /^https?:\/\//i.test(
      configCache.bannerMarcaUrl,
    )
      ? configCache.bannerMarcaUrl
      : "";
    mostrarPreviewGenerico(
      "preview-banner-marca",
      "btn-remover-banner-marca",
      configCache.bannerMarcaUrl,
      "Banner da marca",
    );
  }

  alternarFundoHeader(configCache.fundoHeaderTipo || "cor");
  document.getElementById("fundoHeaderCor").value =
    configCache.fundoHeaderCor || configCache.corPrincipal || "#121212";
  document.getElementById("fundoHeaderOverlay").value =
    configCache.fundoHeaderOverlay ?? 35;
  document.getElementById("fundo-header-overlay-valor").textContent =
    configCache.fundoHeaderOverlay ?? 35;
  if (configCache.fundoHeaderImagemUrl) {
    if (/^https?:\/\//i.test(configCache.fundoHeaderImagemUrl)) {
      document.getElementById("fundoHeaderUrl").value =
        configCache.fundoHeaderImagemUrl;
    }
    mostrarPreviewGenerico(
      "preview-fundo-header",
      "btn-remover-fundo-header",
      configCache.fundoHeaderImagemUrl,
      "Fundo do header",
    );
  }
  document.getElementById("fundoSiteTipo").value =
    configCache.fundoSiteTipo || "padrao";
  document.getElementById("fundoSiteCor").value =
    configCache.fundoSiteCor || "#f7f8fa";
  document.getElementById("fundoSiteOverlay").value =
    configCache.fundoSiteOverlay ?? 0;
  document.getElementById("fundo-site-overlay-valor").textContent =
    configCache.fundoSiteOverlay ?? 0;
  if (configCache.fundoSiteImagemUrl) {
    if (/^https?:\/\//i.test(configCache.fundoSiteImagemUrl)) {
      document.getElementById("fundoSiteUrl").value =
        configCache.fundoSiteImagemUrl;
    }
    mostrarPreviewGenerico(
      "preview-fundo-site",
      "btn-remover-fundo-site",
      configCache.fundoSiteImagemUrl,
      "Fundo do site",
    );
  }
  alternarFundoSite();
  aplicarTemaPortal(configCache);

  HOME_SWITCH_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.checked = configCache.home?.[id] !== false;
    }
  });

  if (configCache.logoUrl)
    mostrarPreviewGenerico(
      "preview-logo",
      "btn-remover-logo",
      configCache.logoUrl,
      configCache.nomePortal,
    );
  if (configCache.faviconUrl) {
    if (/^https?:\/\//i.test(configCache.faviconUrl)) {
      const fUrl = document.getElementById("faviconUrl");
      if (fUrl) fUrl.value = configCache.faviconUrl;
    }
    mostrarPreviewGenerico(
      "preview-favicon",
      "btn-remover-favicon",
      configCache.faviconUrl,
      "Favicon",
    );
  }
  if (configCache.imagemPadraoUrl)
    mostrarPreviewGenerico(
      "preview-imagem-padrao",
      "btn-remover-imagem-padrao",
      configCache.imagemPadraoUrl,
      "Imagem padrao",
    );

  if (configCache.buscaImagemUrl) {
    if (/^https?:\/\//i.test(configCache.buscaImagemUrl)) {
      const bUrl = document.getElementById("buscaImagemUrl");
      if (bUrl) bUrl.value = configCache.buscaImagemUrl;
      const btnUrl = document.querySelector('[data-busca-imagem="url"]');
      if (btnUrl) btnUrl.click();
    }
    mostrarPreviewGenerico(
      "preview-busca-imagem",
      "btn-remover-busca-imagem",
      configCache.buscaImagemUrl,
      "Imagem da Busca",
    );
  }
  const inputBuscaAltura = document.getElementById("buscaImagemAltura");
  if (inputBuscaAltura) {
    inputBuscaAltura.value = configCache.buscaImagemAltura || 50;
    const spanAlt = document.getElementById("busca-imagem-altura-valor");
    if (spanAlt) spanAlt.textContent = configCache.buscaImagemAltura || 50;
  }

  const inputBuscaLargura = document.getElementById("buscaLargura");
  if (inputBuscaLargura) {
    inputBuscaLargura.value = configCache.buscaLargura || 640;
    const spanLarg = document.getElementById("busca-largura-valor");
    if (spanLarg) spanLarg.textContent = configCache.buscaLargura || 640;
  }

  const inputBuscaCor = document.getElementById("buscaCorFundo");
  if (inputBuscaCor)
    inputBuscaCor.value = configCache.buscaCorFundo || "#ffffff";

  const inputBuscaTextoBtn = document.getElementById("buscaTextoBotao");
  if (inputBuscaTextoBtn)
    inputBuscaTextoBtn.value = configCache.buscaTextoBotao || "Buscar";

  const inputBuscaCorBtn = document.getElementById("buscaCorTextoBotao");
  if (inputBuscaCorBtn)
    inputBuscaCorBtn.value = configCache.buscaCorTextoBotao || "#ffffff";

  const inputBuscaPadding = document.getElementById("buscaPaddingVertical");
  if (inputBuscaPadding) {
    inputBuscaPadding.value = configCache.buscaPaddingVertical || 31;
    const spanPad = document.getElementById("busca-padding-valor");
    if (spanPad) spanPad.textContent = configCache.buscaPaddingVertical || 31;
  }

  const chkPatrocinadores = document.getElementById("mostrarPatrocinadores");
  if (chkPatrocinadores)
    chkPatrocinadores.checked =
      configCache.home?.mostrarPatrocinadores !== false;

  const inputPatrocinadoresTitulo = document.getElementById(
    "patrocinadoresTitulo",
  );
  if (inputPatrocinadoresTitulo) {
    inputPatrocinadoresTitulo.value =
      configCache.home?.patrocinadoresTitulo || "";
  }

  const inputPatrocinadoresCorFundo = document.getElementById(
    "patrocinadoresCorFundo",
  );
  if (inputPatrocinadoresCorFundo)
    inputPatrocinadoresCorFundo.value =
      configCache.home?.patrocinadoresCorFundo || "#f8f9fa";

  const inputPatrocinadoresCorTexto = document.getElementById(
    "patrocinadoresCorTexto",
  );
  if (inputPatrocinadoresCorTexto)
    inputPatrocinadoresCorTexto.value =
      configCache.home?.patrocinadoresCorTexto || "#6c757d";

  const inputPatrocinadoresAltura = document.getElementById(
    "patrocinadoresAltura",
  );
  if (inputPatrocinadoresAltura) {
    inputPatrocinadoresAltura.value =
      configCache.home?.patrocinadoresAltura || 40;
    const spanPatrAlt = document.getElementById("patrocinadores-altura-valor");
    if (spanPatrAlt)
      spanPatrAlt.textContent = configCache.home?.patrocinadoresAltura || 40;
  }

  const inputPatrocinadoresVelocidade = document.getElementById(
    "patrocinadoresVelocidade",
  );
  if (inputPatrocinadoresVelocidade) {
    inputPatrocinadoresVelocidade.value =
      configCache.home?.patrocinadoresVelocidade || 25;
    const spanPatrVel = document.getElementById(
      "patrocinadores-velocidade-valor",
    );
    if (spanPatrVel)
      spanPatrVel.textContent =
        configCache.home?.patrocinadoresVelocidade || 25;
  }

  const inputTamanhoFotoAutor = document.getElementById("tamanhoFotoAutor");
  if (inputTamanhoFotoAutor) {
    inputTamanhoFotoAutor.value = configCache.home?.tamanhoFotoAutor || 70;
    const spanTamanhoFotoAutor = document.getElementById(
      "tamanho-foto-autor-valor",
    );
    if (spanTamanhoFotoAutor)
      spanTamanhoFotoAutor.textContent =
        configCache.home?.tamanhoFotoAutor || 70;
  }

  marcarModeloCarrosselAtivo(configCache.home?.modeloCarrossel || "editorial");
  atualizarAjudaMarca();
  ordemWidgetsAtual = configCache.home?.ordemWidgets || [
    "maisLidas",
    "jogos",
    "enquete",
    "tabela",
    "odds",
    "videos",
    "portais",
  ];

  const gridCasas = document.getElementById("grid-casas-apostas");
  if (gridCasas) {
    const casasSalvas =
      configCache.home?.casasDeApostasPermitidas || CASAS_DE_APOSTA;
    gridCasas.innerHTML = CASAS_DE_APOSTA.map(
      (casa) => `
      <div class="col-6 col-md-4 col-lg-3">
        <label class="admin-check m-0">
          <input type="checkbox" class="form-check-input" name="casasDeApostasPermitidas" value="${casa}" ${casasSalvas.includes(casa) ? "checked" : ""}>
          ${escapeHtml(casa)}
        </label>
      </div>
    `,
    ).join("");
  }

  const selectDestaque = document.getElementById("casaDeApostaDestaque");
  if (selectDestaque) {
    const destaqueSalvo = configCache.home?.casaDeApostaDestaque || "VBET";
    selectDestaque.innerHTML = CASAS_DE_APOSTA.map(
      (casa) => `
      <option value="${escapeHtml(casa)}" ${casa === destaqueSalvo ? "selected" : ""}>${escapeHtml(casa)}</option>
      `,
    ).join("");
  }

  const gridPortais = document.getElementById("grid-portais-permitidos");
  if (gridPortais) {
    const portaisSalvos = configCache.home?.portaisPermitidos || TODOS_PORTAIS;
    gridPortais.innerHTML = TODOS_PORTAIS.map(
      (portal) => `
      <div class="col-6 col-md-4 col-lg-3">
        <label class="admin-check m-0">
          <input type="checkbox" class="form-check-input" name="portaisPermitidos" value="${escapeHtml(portal)}" ${portaisSalvos.includes(portal) ? "checked" : ""}>
          ${escapeHtml(portal)}
        </label>
      </div>
    `,
    ).join("");
  }

  montarFormularioWidgetsAdmin();
  await inicializarSeletorCarrossel();
  renderizarPreviewLayout();
}

function montarGradeModelosCarrossel() {
  const grid = document.getElementById("carousel-model-grid");
  if (!grid || typeof MODELOS_CARROSSEL === "undefined") return;

  grid.innerHTML = Object.entries(MODELOS_CARROSSEL)
    .map(
      ([id, info]) => `
    <button type="button" class="carousel-model-card" data-modelo="${id}">
      <strong>${escapeHtml(info.label)}</strong>
      <span>${escapeHtml(info.desc)}</span>
    </button>
  `,
    )
    .join("");

  grid.addEventListener("click", (event) => {
    const card = event.target.closest("[data-modelo]");
    if (!card) return;
    document.getElementById("modeloCarrossel").value = card.dataset.modelo;
    marcarModeloCarrosselAtivo(card.dataset.modelo);
    renderizarPreviewLayout();
  });
}

function marcarModeloCarrosselAtivo(modelo) {
  document.querySelectorAll(".carousel-model-card").forEach((card) => {
    card.classList.toggle("is-active", card.dataset.modelo === modelo);
  });
}

function atualizarAjudaMarca() {
  const modo = document.getElementById("modoMarca")?.value || "texto";
  const grupo = document.getElementById("grupo-banner-marca");
  if (grupo)
    grupo.classList.toggle("d-none", modo === "texto" || modo === "icone");
}

function alternarFundoHeader(tipo = "cor") {
  document.getElementById("fundoHeaderTipo").value = tipo;
  document.querySelectorAll("[data-fundo-header]").forEach((botao) => {
    botao.classList.toggle("is-active", botao.dataset.fundoHeader === tipo);
  });
  document
    .getElementById("painel-fundo-header-cor")
    ?.classList.toggle("d-none", tipo !== "cor");
  document
    .getElementById("painel-fundo-header-imagem")
    ?.classList.toggle("d-none", tipo !== "imagem");
  aplicarTemaPortal(lerTemaPreview());
}

function alternarFundoSite() {
  const tipo = document.getElementById("fundoSiteTipo")?.value || "padrao";
  document
    .getElementById("painel-fundo-site-cor")
    ?.classList.toggle("d-none", tipo !== "cor");
  document
    .getElementById("painel-fundo-site-imagem")
    ?.classList.toggle("d-none", tipo !== "imagem");
  aplicarTemaPortal(lerTemaPreview());
}

function lerTemaPreview() {
  return {
    corPrincipal: document.getElementById("corPrincipal")?.value,
    corAcento: document.getElementById("corAcento")?.value,
    fundoHeaderTipo: document.getElementById("fundoHeaderTipo")?.value,
    fundoHeaderCor: document.getElementById("fundoHeaderCor")?.value,
    fundoHeaderImagemUrl:
      document.getElementById("preview-fundo-header")?.querySelector("img")
        ?.src ||
      document.getElementById("fundoHeaderUrl")?.value ||
      "",
    fundoHeaderOverlay: document.getElementById("fundoHeaderOverlay")?.value,
    fundoSiteTipo: document.getElementById("fundoSiteTipo")?.value,
    fundoSiteCor: document.getElementById("fundoSiteCor")?.value,
    fundoSiteImagemUrl:
      document.getElementById("preview-fundo-site")?.querySelector("img")
        ?.src ||
      document.getElementById("fundoSiteUrl")?.value ||
      "",
    fundoSiteOverlay: document.getElementById("fundoSiteOverlay")?.value,
  };
}

function previewFundoHeaderUrl() {
  const url = document.getElementById("fundoHeaderUrl")?.value.trim();
  if (!url) return;
  document.getElementById("remover-fundo-header").value = "false";
  alternarFundoHeader("imagem");
  mostrarPreviewGenerico(
    "preview-fundo-header",
    "btn-remover-fundo-header",
    url,
    "Fundo do header",
  );
  aplicarTemaPortal(lerTemaPreview());
}

function previewFundoSiteUrl() {
  const url = document.getElementById("fundoSiteUrl")?.value.trim();
  if (!url) return;
  document.getElementById("remover-fundo-site").value = "false";
  document.getElementById("fundoSiteTipo").value = "imagem";
  alternarFundoSite();
  mostrarPreviewGenerico(
    "preview-fundo-site",
    "btn-remover-fundo-site",
    url,
    "Fundo do site",
  );
  aplicarTemaPortal(lerTemaPreview());
}

function previewBannerUrl() {
  const url = document.getElementById("bannerMarcaUrl")?.value.trim();
  if (!url) return;
  document.getElementById("remover-banner-marca").value = "false";
  mostrarPreviewGenerico(
    "preview-banner-marca",
    "btn-remover-banner-marca",
    url,
    "Banner da marca",
  );
}

async function salvarCarrosselConfig() {
  const resposta = await fetch("/api/config/carrossel", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      ids: carrosselSelecionados,
      limite: limiteCarrosselAtual(),
    }),
  });

  if (!resposta.ok) {
    throw new Error("Falha ao salvar o carrossel.");
  }

  return resposta.json();
}

async function salvarConfig(event) {
  event.preventDefault();

  if (!configCache) configCache = {};
  if (!configCache.home) configCache.home = {};
  if (!configCache.home.widgets) configCache.home.widgets = {};

  // Garante que as mudanças de ordem dos widgets recarreguem todos os valores atuais no cache antes do envio
  Object.entries(WIDGETS_ADMIN_MAP).forEach(([k, meta]) => {
    if (!configCache.home.widgets[k]) configCache.home.widgets[k] = {};
    const t = document.getElementById(`${meta.prefix}Titulo`);
    const s = document.getElementById(`${meta.prefix}Subtitulo`);
    const i = document.getElementById(`${meta.prefix}Icone`);
    const l = document.getElementById(`${meta.prefix}Layout`);
    if (t) configCache.home.widgets[k].titulo = t.value;
    if (s) configCache.home.widgets[k].subtitulo = s.value;
    if (i) configCache.home.widgets[k].icone = i.value;
    if (l) configCache.home.widgets[k].layout = l.value;
  });

  const dados = new FormData(formConfig);
  HOME_SWITCH_IDS.forEach((id) =>
    dados.set(id, document.getElementById(id)?.checked ? "true" : "false"),
  );

  const val = (id) => document.getElementById(id)?.value || "";
  const chk = (id) => (document.getElementById(id)?.checked ? "true" : "false");

  dados.set("limiteNoticias", val("limiteNoticias"));
  dados.set("limiteJogos", val("limiteJogos"));
  dados.set("limiteCarrossel", val("limiteCarrossel"));
  dados.set("logoTremor", val("logoTremor"));
  dados.set("logoEfeito", val("logoEfeito"));
  if (document.getElementById("limiteVideos"))
    dados.set("limiteVideos", val("limiteVideos"));
  if (document.getElementById("youtubeChannelId"))
    dados.set("youtubeChannelId", val("youtubeChannelId"));
  if (document.getElementById("modoVideos"))
    dados.set("modoVideos", val("modoVideos"));
  if (document.getElementById("textoBotaoVideo"))
    dados.set("textoBotaoVideo", val("textoBotaoVideo"));
  if (document.getElementById("videosCorBotao"))
    dados.set("videosCorBotao", val("videosCorBotao"));
  if (document.getElementById("videosIntervalo"))
    dados.set("videosIntervalo", val("videosIntervalo"));
  if (document.getElementById("videosProporcao"))
    dados.set("videosProporcao", val("videosProporcao"));
  if (document.getElementById("limiteRss")) {
    dados.set("limiteRss", val("limiteRss"));
  }
  dados.set("temaCarrossel", val("temaCarrossel"));
  dados.set("modeloCarrossel", val("modeloCarrossel"));
  dados.set("alturaCarrossel", val("alturaCarrossel"));
  dados.set("autoplayCarrossel", val("autoplayCarrossel"));
  dados.set("mostrarResumoCarrossel", chk("mostrarResumoCarrossel"));
  dados.set("mostrarMiniaturasCarrossel", chk("mostrarMiniaturasCarrossel"));
  dados.set("mostrarDotsCarrossel", chk("mostrarDotsCarrossel"));
  dados.set("mostrarContadorCarrossel", chk("mostrarContadorCarrossel"));
  dados.set("mostrarSetasCarrossel", chk("mostrarSetasCarrossel"));
  dados.set("efeitoCamaleao", chk("efeitoCamaleao"));
  if (document.getElementById("carrosselAutoRss")) {
    dados.set("carrosselAutoRss", chk("carrosselAutoRss"));
  }
  dados.set("modoMarca", val("modoMarca"));
  dados.set("alturaBannerMarca", val("alturaBannerMarca"));
  dados.set("mostrarTextoMarca", chk("mostrarTextoMarca"));
  dados.set("carrosselIds", JSON.stringify(carrosselSelecionados));
  dados.set("ordemWidgets", JSON.stringify(ordemWidgetsAtual));

  // Injeta os dados dos widgets forçadamente no FormData para evitar campos em branco após o DOM ser reordenado
  Object.entries(WIDGETS_ADMIN_MAP).forEach(([k, meta]) => {
    const cfg = configCache.home.widgets[k];
    if (cfg) {
      dados.set(`${meta.prefix}Titulo`, cfg.titulo || "");
      dados.set(`${meta.prefix}Subtitulo`, cfg.subtitulo || "");
      dados.set(`${meta.prefix}Icone`, cfg.icone || "sem");
      dados.set(`${meta.prefix}Layout`, cfg.layout || "");
      if (k === "twitter") {
        dados.set(`${meta.prefix}TempoExibicao`, cfg.tempoExibicao || "5");
        dados.set(`${meta.prefix}TipoTransicao`, cfg.tipoTransicao || "slide");
        dados.set(`${meta.prefix}Velocidade`, cfg.velocidadeTransicao || "500");
        dados.set(`${meta.prefix}QtdConta`, cfg.quantidadePorConta || "3");
        dados.set(
          `${meta.prefix}MostrarMidia`,
          cfg.mostrarMidia !== false ? "true" : "false",
        );
      }
    }
  });

  if (document.getElementById("grid-casas-apostas")) {
    const casasSelecionadas = Array.from(
      document.querySelectorAll(
        'input[name="casasDeApostasPermitidas"]:checked',
      ),
    ).map((cb) => cb.value);
    dados.set("casasDeApostasPermitidas", JSON.stringify(casasSelecionadas));
  }
  if (document.getElementById("grid-portais-permitidos")) {
    const portaisSelecionados = Array.from(
      document.querySelectorAll('input[name="portaisPermitidos"]:checked'),
    ).map((cb) => cb.value);
    dados.set("portaisPermitidos", JSON.stringify(portaisSelecionados));
  }
  if (document.getElementById("casaDeApostaDestaque")) {
    dados.set(
      "casaDeApostaDestaque",
      document.getElementById("casaDeApostaDestaque").value,
    );
  }
  if (document.getElementById("buscaCorFundo")) {
    dados.set("buscaCorFundo", document.getElementById("buscaCorFundo").value);
  }
  if (document.getElementById("buscaPlaceholder")) {
    dados.set(
      "buscaPlaceholder",
      document.getElementById("buscaPlaceholder").value,
    );
  }
  if (document.getElementById("buscaPaddingVertical")) {
    dados.set(
      "buscaPaddingVertical",
      document.getElementById("buscaPaddingVertical").value,
    );
  }
  if (document.getElementById("buscaTextoBotao")) {
    dados.set(
      "buscaTextoBotao",
      document.getElementById("buscaTextoBotao").value,
    );
  }
  if (document.getElementById("buscaCorTextoBotao")) {
    dados.set(
      "buscaCorTextoBotao",
      document.getElementById("buscaCorTextoBotao").value,
    );
  }
  if (document.getElementById("mostrarPatrocinadores")) {
    dados.set(
      "mostrarPatrocinadores",
      document.getElementById("mostrarPatrocinadores").checked
        ? "true"
        : "false",
    );
  }
  if (document.getElementById("patrocinadoresTitulo")) {
    dados.set(
      "patrocinadoresTitulo",
      document.getElementById("patrocinadoresTitulo").value,
    );
  }
  if (document.getElementById("patrocinadoresAltura")) {
    dados.set(
      "patrocinadoresAltura",
      document.getElementById("patrocinadoresAltura").value,
    );
  }
  if (document.getElementById("patrocinadoresCorFundo")) {
    dados.set(
      "patrocinadoresCorFundo",
      document.getElementById("patrocinadoresCorFundo").value,
    );
  }
  if (document.getElementById("patrocinadoresCorTexto")) {
    dados.set(
      "patrocinadoresCorTexto",
      document.getElementById("patrocinadoresCorTexto").value,
    );
  }
  if (document.getElementById("patrocinadoresVelocidade")) {
    dados.set(
      "patrocinadoresVelocidade",
      document.getElementById("patrocinadoresVelocidade").value,
    );
  }
  if (document.getElementById("tamanhoFotoAutor")) {
    dados.set(
      "tamanhoFotoAutor",
      document.getElementById("tamanhoFotoAutor").value,
    );
  }

  try {
    const resposta = await fetch("/api/config", {
      method: "PUT",
      credentials: "same-origin",
      body: dados,
    });

    if (!resposta.ok) {
      const errData = await resposta.json().catch(() => ({}));
      mostrarToast(
        `Erro ao salvar: ${errData.erro || resposta.statusText}`,
        "danger",
      );
      return;
    }

    await salvarCarrosselConfig();

    const configAtualizada = await fetch("/api/config", {
      credentials: "same-origin",
    });
    configCache = await configAtualizada.json();
  } catch {
    mostrarToast("Nao foi possivel salvar a selecao do carrossel.", "danger");
    return;
  }
  aplicarTemaPortal(configCache);
  carrosselSelecionados = [...(configCache.home?.carrosselIds || [])];
  renderizarPreviewLayout();
  renderizarSeletorCarrossel();
  document.querySelector(".admin-sticky-bar")?.classList.remove("is-visible");
  mostrarToast("Configuracao da pagina inicial salva com sucesso.");
}

function renderizarPreviewLayout() {
  const blocos = [
    { id: "mostrarBusca", label: "Busca" },
    { id: "mostrarCarrossel", label: "Carrossel" },
    { id: "mostrarUltimas", label: "Ultimas noticias" },
    { id: "mostrarMaisLidas", label: "Mais lidas" },
    { id: "mostrarJogos", label: "Jogos" },
    { id: "mostrarEnquete", label: "Enquete" },
    { id: "mostrarTabela", label: "Tabela" },
    { id: "mostrarOdds", label: "Odds" },
    { id: "mostrarVideos", label: "Vídeos" },
    { id: "mostrarTwitter", label: "Twitter" },
    { id: "mostrarPortais", label: "Portais" },
  ];

  document.getElementById("preview-layout-home").innerHTML = blocos
    .map((bloco) => {
      const ativo = document.getElementById(bloco.id)?.checked;
      return `<span class="layout-chip ${ativo ? "is-on" : ""}">${escapeHtml(bloco.label)}</span>`;
    })
    .join("");

  const tema =
    document.getElementById("temaCarrossel")?.value === "escuro"
      ? "Escuro"
      : "Claro";
  const modelo =
    document.getElementById("modeloCarrossel")?.value || "editorial";
  const modeloLabel =
    (typeof MODELOS_CARROSSEL !== "undefined" &&
      MODELOS_CARROSSEL[modelo]?.label) ||
    modelo;
  const altura = document.getElementById("alturaCarrossel")?.value || "medio";
  const carrossel = document.getElementById("mostrarCarrossel")?.checked;
  const qtdCarrossel = carrosselSelecionados.length;
  const controles =
    [
      document.getElementById("mostrarDotsCarrossel")?.checked
        ? "barras"
        : null,
      document.getElementById("mostrarContadorCarrossel")?.checked
        ? "numeros"
        : null,
      document.getElementById("mostrarSetasCarrossel")?.checked
        ? "setas"
        : null,
    ]
      .filter(Boolean)
      .join(", ") || "nenhum";
  document.getElementById("preview-layout-home").innerHTML += `
    <div class="layout-meta">
      <span>Carrossel: ${carrossel ? `ativo · ${modeloLabel} · ${tema} · altura ${altura} · ${qtdCarrossel} slide(s) · controles: ${controles}` : "oculto"}</span>
      <span>Marca: ${document.getElementById("modoMarca")?.value || "texto"}</span>
      <span>Lista: ${document.getElementById("limiteNoticias")?.value || 6} por pagina</span>
    </div>
  `;
}

const WIDGETS_ADMIN_MAP = {
  maisLidas: { prefix: "widgetMaisLidas", label: "Mais lidas" },
  jogos: { prefix: "widgetJogos", label: "Agenda de jogos" },
  enquete: { prefix: "widgetEnquete", label: "Enquete" },
  tabela: { prefix: "widgetTabela", label: "Tabela Brasileirão" },
  odds: { prefix: "widgetOdds", label: "Odds Esportivas" },
  videos: { prefix: "widgetVideos", label: "Vídeos do YouTube" },
  twitter: { prefix: "widgetTwitter", label: "Twitter / X" },
  portais: { prefix: "widgetPortais", label: "Últimas dos Portais" },
};

function salvarEstadoWidgetsAdmin() {
  Object.entries(WIDGETS_ADMIN_MAP).forEach(([k, meta]) => {
    if (!configCache.home.widgets[k]) configCache.home.widgets[k] = {};
    configCache.home.widgets[k].titulo =
      document.getElementById(`${meta.prefix}Titulo`)?.value || "";
    configCache.home.widgets[k].subtitulo =
      document.getElementById(`${meta.prefix}Subtitulo`)?.value || "";
    configCache.home.widgets[k].icone =
      document.getElementById(`${meta.prefix}Icone`)?.value || "sem";
    configCache.home.widgets[k].layout =
      document.getElementById(`${meta.prefix}Layout`)?.value || "";
    if (k === "twitter") {
      configCache.home.widgets[k].tempoExibicao =
        document.getElementById(`${meta.prefix}TempoExibicao`)?.value || "5";
      configCache.home.widgets[k].tipoTransicao =
        document.getElementById(`${meta.prefix}TipoTransicao`)?.value ||
        "slide";
      configCache.home.widgets[k].velocidadeTransicao =
        document.getElementById(`${meta.prefix}Velocidade`)?.value || "500";
      configCache.home.widgets[k].quantidadePorConta =
        document.getElementById(`${meta.prefix}QtdConta`)?.value || "3";
      configCache.home.widgets[k].mostrarMidia = document.getElementById(
        `${meta.prefix}MostrarMidia`,
      )?.checked;
    }
  });
}

window.moverWidgetAdmin = function (chave, dir) {
  salvarEstadoWidgetsAdmin();

  const idx = ordemWidgetsAtual.indexOf(chave);
  const novoIdx = idx + dir;
  if (novoIdx < 0 || novoIdx >= ordemWidgetsAtual.length) return;

  const temp = ordemWidgetsAtual[novoIdx];
  ordemWidgetsAtual[novoIdx] = ordemWidgetsAtual[idx];
  ordemWidgetsAtual[idx] = temp;

  montarFormularioWidgetsAdmin();
  preencherFormularioWidgetsAdmin(configCache);
};

function montarFormularioWidgetsAdmin() {
  const grid = document.getElementById("widgets-admin-grid");
  if (!grid || typeof LAYOUTS_WIDGET === "undefined") return;

  // Garante que o layout "carrossel" exista internamente para o Twitter
  if (LAYOUTS_WIDGET.twitter && !LAYOUTS_WIDGET.twitter.carrossel) {
    LAYOUTS_WIDGET.twitter.carrossel = {
      label: "Carrossel de Slides",
      icone: "play",
    };
  }

  grid.innerHTML = ordemWidgetsAtual
    .map((chave, index) => {
      const meta = WIDGETS_ADMIN_MAP[chave];
      if (!meta) return "";
      const layouts = LAYOUTS_WIDGET[chave] || {};
      const icones = Object.entries(ICONES_WIDGET)
        .map(
          ([id, info]) =>
            `<option value="${id}">${escapeHtml(info.label)}</option>`,
        )
        .join("");
      const layoutOptions = Object.entries(layouts)
        .map(
          ([id, info]) =>
            `<option value="${id}">${escapeHtml(info.label)}</option>`,
        )
        .join("");

      const switchId =
        "mostrar" + chave.charAt(0).toUpperCase() + chave.slice(1);

      return `
      <article class="widget-admin-card" data-widget-key="${chave}" style="transition: transform 0.2s ease, opacity 0.2s ease;">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div class="d-flex align-items-center gap-2">
            <div class="drag-handle text-muted" style="cursor: grab;" title="Arraste para reordenar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>
            </div>
            <h4 class="m-0">${escapeHtml(meta.label)}</h4>
          </div>
          <div class="d-flex align-items-center gap-3">
            <div class="form-check form-switch m-0">
              <input class="form-check-input sync-widget-switch" type="checkbox" data-sync="${switchId}" id="switch_${chave}" style="cursor: pointer;">
              <label class="form-check-label small text-muted" for="switch_${chave}" style="cursor: pointer;">Exibir</label>
            </div>
            <div class="btn-group">
              <button type="button" class="btn btn-outline-secondary btn-sm" onclick="moverWidgetAdmin('${chave}', -1)" ${index === 0 ? "disabled" : ""} title="Subir">↑</button>
              <button type="button" class="btn btn-outline-secondary btn-sm" onclick="moverWidgetAdmin('${chave}', 1)" ${index === ordemWidgetsAtual.length - 1 ? "disabled" : ""} title="Descer">↓</button>
            </div>
          </div>
        </div>
        <div class="mb-2">
          <label class="form-label">Titulo</label>
          <input type="text" class="form-control" id="${meta.prefix}Titulo" name="${meta.prefix}Titulo">
        </div>
        <div class="mb-2">
          <label class="form-label">Subtitulo</label>
          <input type="text" class="form-control" id="${meta.prefix}Subtitulo" name="${meta.prefix}Subtitulo">
        </div>
        <div class="row g-2">
          <div class="col-6">
            <label class="form-label">Icone</label>
            <select class="form-select" id="${meta.prefix}Icone" name="${meta.prefix}Icone">${icones}</select>
          </div>
          <div class="col-6">
            <label class="form-label">Layout</label>
            <select class="form-select" id="${meta.prefix}Layout" name="${meta.prefix}Layout">${layoutOptions}</select>
          </div>
        </div>
        ${
          chave === "twitter"
            ? `
        <div class="row g-2 mt-2 border-top border-secondary border-opacity-10 pt-2">
          <div class="col-md-6 mb-2">
            <label class="form-label small fw-bold text-secondary">Tempo de Exibição (s)</label>
            <input type="number" class="form-control" id="${meta.prefix}TempoExibicao" name="${meta.prefix}TempoExibicao" min="1">
          </div>
          <div class="col-md-6 mb-2">
            <label class="form-label small fw-bold text-secondary">Qtd Tweets / Conta</label>
            <input type="number" class="form-control" id="${meta.prefix}QtdConta" name="${meta.prefix}QtdConta" min="1" max="15">
          </div>
        </div>
        <div class="row g-2">
          <div class="col-md-6 mb-2">
            <label class="form-label small fw-bold text-secondary">Tipo de Transição</label>
            <select class="form-select" id="${meta.prefix}TipoTransicao" name="${meta.prefix}TipoTransicao">
              <option value="slide">Deslizamento (Slide)</option>
              <option value="fade">Esmaecimento (Fade)</option>
            </select>
          </div>
          <div class="col-md-6 mb-2">
            <label class="form-label small fw-bold text-secondary">Velocidade Efeito (ms)</label>
            <input type="number" class="form-control" id="${meta.prefix}Velocidade" name="${meta.prefix}Velocidade" min="100" step="100">
          </div>
        </div>
        <div class="form-check form-switch mt-2">
          <input class="form-check-input" type="checkbox" role="switch" id="${meta.prefix}MostrarMidia" name="${meta.prefix}MostrarMidia">
          <label class="form-check-label small fw-bold text-secondary" for="${meta.prefix}MostrarMidia">Exibir mídias e fotos anexadas aos tweets</label>
        </div>
        `
            : ""
        }
        <div class="widget-admin-preview" id="${meta.prefix}Preview"></div>
      </article>
    `;
    })
    .join("");

  grid.querySelectorAll(".sync-widget-switch").forEach((chk) => {
    const mainSwitch = document.getElementById(chk.dataset.sync);
    if (mainSwitch) {
      chk.checked = mainSwitch.checked;
      chk.addEventListener("change", (e) => {
        mainSwitch.checked = e.target.checked;
        renderizarPreviewLayout();
      });
    }
  });

  grid.querySelectorAll("select, input").forEach((campo) => {
    campo.addEventListener("change", atualizarPreviewWidgetAdmin);
    campo.addEventListener("input", atualizarPreviewWidgetAdmin);
  });

  // Configuração nativa de Drag and Drop (Arrastar e Soltar)
  let draggedItem = null;
  grid.querySelectorAll(".widget-admin-card").forEach((card) => {
    const handle = card.querySelector(".drag-handle");

    // Evita conflitos com os inputs de texto permitindo arrastar APENAS pela alça
    handle.addEventListener("mousedown", () =>
      card.setAttribute("draggable", "true"),
    );
    handle.addEventListener("mouseup", () => card.removeAttribute("draggable"));
    card.addEventListener("dragend", () => card.removeAttribute("draggable"));

    card.addEventListener("dragstart", function (e) {
      draggedItem = this;
      e.dataTransfer.effectAllowed = "move";
      setTimeout(() => this.classList.add("opacity-50"), 0);
    });

    card.addEventListener("dragover", function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    });

    card.addEventListener("dragenter", function (e) {
      e.preventDefault();
      if (this !== draggedItem) {
        this.style.border = "2px dashed var(--accent)";
        this.style.transform = "scale(1.01)";
      }
    });

    card.addEventListener("dragleave", function () {
      this.style.border = "";
      this.style.transform = "";
    });

    card.addEventListener("drop", function (e) {
      e.stopPropagation();
      this.style.border = "";
      this.style.transform = "";

      if (draggedItem && this !== draggedItem) {
        salvarEstadoWidgetsAdmin(); // Salva textos preenchidos para não perdê-los no recarregamento
        const draggedKey = draggedItem.dataset.widgetKey;
        const targetKey = this.dataset.widgetKey;
        const fromIndex = ordemWidgetsAtual.indexOf(draggedKey);
        const toIndex = ordemWidgetsAtual.indexOf(targetKey);
        ordemWidgetsAtual.splice(fromIndex, 1);
        ordemWidgetsAtual.splice(toIndex, 0, draggedKey);
        montarFormularioWidgetsAdmin();
        preencherFormularioWidgetsAdmin(configCache);
        document
          .querySelector(".admin-sticky-bar")
          ?.classList.add("is-visible");
      }
    });
  });
}

function preencherFormularioWidgetsAdmin(config) {
  const widgets = normalizarWidgetsConfig(config.home || {});
  ordemWidgetsAtual.forEach((chave) => {
    const meta = WIDGETS_ADMIN_MAP[chave];
    if (!meta) return;
    const cfg = widgets[chave];
    if (!cfg) return;
    const tituloEl = document.getElementById(`${meta.prefix}Titulo`);
    if (tituloEl) tituloEl.value = cfg.titulo || "";
    const subtituloEl = document.getElementById(`${meta.prefix}Subtitulo`);
    if (subtituloEl) subtituloEl.value = cfg.subtitulo || "";
    const iconeEl = document.getElementById(`${meta.prefix}Icone`);
    if (iconeEl) iconeEl.value = cfg.icone || "sem";
    const layoutEl = document.getElementById(`${meta.prefix}Layout`);
    if (layoutEl) layoutEl.value = cfg.layout || "";

    if (chave === "twitter") {
      const tempoEl = document.getElementById(`${meta.prefix}TempoExibicao`);
      if (tempoEl) tempoEl.value = cfg.tempoExibicao || "5";
      const tipoEl = document.getElementById(`${meta.prefix}TipoTransicao`);
      if (tipoEl) tipoEl.value = cfg.tipoTransicao || "slide";
      const velEl = document.getElementById(`${meta.prefix}Velocidade`);
      if (velEl) velEl.value = cfg.velocidadeTransicao || "500";
      const qtdEl = document.getElementById(`${meta.prefix}QtdConta`);
      if (qtdEl) qtdEl.value = cfg.quantidadePorConta || "3";
      const midiaEl = document.getElementById(`${meta.prefix}MostrarMidia`);
      if (midiaEl) midiaEl.checked = cfg.mostrarMidia !== false;
    }

    atualizarPreviewWidgetAdmin({
      target: document.getElementById(`${meta.prefix}Icone`),
    });
  });
}

function atualizarPreviewWidgetAdmin(event) {
  const card = event.target.closest("[data-widget-key]");
  if (!card) return;
  const chave = card.dataset.widgetKey;
  const meta = WIDGETS_ADMIN_MAP[chave];
  const preview = document.getElementById(`${meta.prefix}Preview`);
  const icone = document.getElementById(`${meta.prefix}Icone`).value;
  const layout = document.getElementById(`${meta.prefix}Layout`).value;
  const titulo = document.getElementById(`${meta.prefix}Titulo`).value;
  preview.innerHTML = `
    <div class="widget-card widget-card--layout-${layout}">
      <header class="widget-card__head">
        ${htmlIconeWidget(icone)}
        <div><h2>${escapeHtml(titulo)}</h2></div>
      </header>
    </div>
  `;
}

function limiteCarrosselAtual() {
  return Math.min(
    Math.max(Number(document.getElementById("limiteCarrossel")?.value) || 5, 1),
    20,
  );
}

function ajustarLimiteCarrossel() {
  const limite = limiteCarrosselAtual();
  if (carrosselSelecionados.length > limite) {
    carrosselSelecionados = carrosselSelecionados.slice(0, limite);
  }
  serializarCarrosselIds();
}

function serializarCarrosselIds() {
  const campo = document.getElementById("carrosselIds");
  if (campo) campo.value = JSON.stringify(carrosselSelecionados);
}

async function inicializarSeletorCarrossel() {
  const selecionados = document.getElementById("carrossel-selecionados");
  const disponiveis = document.getElementById("carrossel-disponiveis");
  if (!selecionados || !disponiveis) return;

  selecionados.innerHTML =
    '<div class="loading-box">Carregando noticias...</div>';
  disponiveis.innerHTML = "";

  try {
    const resposta = await fetch("/api/noticias?admin=true");
    noticiasCarrosselCache = await resposta.json();

    const idsSalvos = configCache?.home?.carrosselIds || [];
    if (idsSalvos.length) {
      carrosselSelecionados = idsSalvos.filter((id) =>
        noticiasCarrosselCache.some(
          (noticia) => String(noticia.id) === String(id),
        ),
      );
    } else {
      carrosselSelecionados = noticiasCarrosselCache
        .filter(
          (noticia) =>
            noticia.destaqueCarousel && noticia.status !== "rascunho",
        )
        .map((noticia) => String(noticia.id));
    }

    ajustarLimiteCarrossel();
    renderizarSeletorCarrossel();
  } catch {
    selecionados.innerHTML =
      '<div class="empty-box">Erro ao carregar noticias.</div>';
  }
}

function renderizarSeletorCarrossel() {
  const selecionadosEl = document.getElementById("carrossel-selecionados");
  const disponiveisEl = document.getElementById("carrossel-disponiveis");
  const contadorEl = document.getElementById("carrossel-contador");
  if (!selecionadosEl || !disponiveisEl) return;

  const limite = limiteCarrosselAtual();
  const busca = (document.getElementById("carrossel-busca")?.value || "")
    .trim()
    .toLowerCase();
  const publicadas = noticiasCarrosselCache.filter(
    (noticia) => noticia.status !== "rascunho",
  );

  if (contadorEl)
    contadorEl.textContent = `${carrosselSelecionados.length} / ${limite}`;

  if (!carrosselSelecionados.length) {
    selecionadosEl.innerHTML =
      '<div class="empty-box">Nenhuma noticia selecionada. Adicione itens ao lado.</div>';
  } else {
    selecionadosEl.innerHTML = carrosselSelecionados
      .map((id, index) => {
        const noticia = noticiasCarrosselCache.find(
          (item) => String(item.id) === String(id),
        );
        if (!noticia) return "";
        const badgeRss = noticia.isRss
          ? `<span class="badge bg-info text-dark ms-1" style="font-size:0.6rem;">RSS</span>`
          : "";
        return `
        <div class="carousel-picker-item is-selected">
          <span class="carousel-picker-pos">${index + 1}</span>
          <div class="carousel-picker-copy">
            <strong>${escapeHtml(noticia.titulo)} ${badgeRss}</strong>
            <span>${escapeHtml(noticia.categoria || "Geral")}</span>
          </div>
          <div class="carousel-picker-actions">
            <button type="button" class="btn btn-outline-secondary btn-sm" data-carousel-action="up" data-id="${noticia.id}" ${index === 0 ? "disabled" : ""}>↑</button>
            <button type="button" class="btn btn-outline-secondary btn-sm" data-carousel-action="down" data-id="${noticia.id}" ${index === carrosselSelecionados.length - 1 ? "disabled" : ""}>↓</button>
            <button type="button" class="btn btn-outline-danger btn-sm" data-carousel-action="remove" data-id="${noticia.id}">×</button>
          </div>
        </div>
      `;
      })
      .join("");
  }

  const disponiveis = publicadas
    .filter((noticia) => !carrosselSelecionados.includes(String(noticia.id)))
    .filter((noticia) => {
      if (!busca) return true;
      const texto =
        `${noticia.titulo} ${noticia.categoria} ${noticia.resumo}`.toLowerCase();
      return texto.includes(busca);
    });

  if (!disponiveis.length) {
    disponiveisEl.innerHTML =
      '<div class="empty-box">Nenhuma noticia disponivel para adicionar.</div>';
    return;
  }

  const lotado = carrosselSelecionados.length >= limite;
  disponiveisEl.innerHTML = disponiveis
    .map((noticia) => {
      const badgeRss = noticia.isRss
        ? `<span class="badge bg-info text-dark ms-1" style="font-size:0.6rem;">RSS</span>`
        : "";
      return `
    <div class="carousel-picker-item">
      <div class="carousel-picker-copy">
        <strong>${escapeHtml(noticia.titulo)} ${badgeRss}</strong>
        <span>${escapeHtml(noticia.categoria || "Geral")}</span>
      </div>
      <button type="button" class="btn btn-outline-dark btn-sm" data-carousel-action="add" data-id="${noticia.id}" ${lotado ? "disabled" : ""}>Adicionar</button>
    </div>
  `;
    })
    .join("");

  if (lotado) {
    disponiveisEl.insertAdjacentHTML(
      "afterbegin",
      `<div class="carousel-picker-alert">Limite de ${limite} slide(s) atingido. Remova um item ou aumente o limite acima.</div>`,
    );
  }

  serializarCarrosselIds();
}

function tratarCliqueCarrossel(event) {
  const botao = event.target.closest("[data-carousel-action]");
  if (!botao) return;

  const acao = botao.dataset.carouselAction;
  const id = String(botao.dataset.id);
  const limite = limiteCarrosselAtual();

  if (acao === "add") {
    if (carrosselSelecionados.length >= limite) return;
    if (!carrosselSelecionados.includes(id)) carrosselSelecionados.push(id);
  }

  if (acao === "remove") {
    carrosselSelecionados = carrosselSelecionados.filter((item) => item !== id);
  }

  if (acao === "up") {
    const index = carrosselSelecionados.indexOf(id);
    if (index > 0) {
      [carrosselSelecionados[index - 1], carrosselSelecionados[index]] = [
        carrosselSelecionados[index],
        carrosselSelecionados[index - 1],
      ];
    }
  }

  if (acao === "down") {
    const index = carrosselSelecionados.indexOf(id);
    if (index !== -1 && index < carrosselSelecionados.length - 1) {
      [carrosselSelecionados[index + 1], carrosselSelecionados[index]] = [
        carrosselSelecionados[index],
        carrosselSelecionados[index + 1],
      ];
    }
  }

  renderizarSeletorCarrossel();
  renderizarPreviewLayout();
}

function previewArquivo(inputId, previewId, buttonId, removerId) {
  const input = document.getElementById(inputId);
  const arquivo = input.files && input.files[0];
  if (!arquivo) return;
  document.getElementById(removerId).value = "false";
  mostrarPreviewGenerico(
    previewId,
    buttonId,
    URL.createObjectURL(arquivo),
    arquivo.name,
  );
}

function mostrarPreviewGenerico(previewId, buttonId, src, alt) {
  const preview = document.getElementById(previewId);
  preview.classList.remove("d-none");
  document.getElementById(buttonId).classList.remove("d-none");
  preview.innerHTML = `<img src="${src}" alt="${escapeHtml(alt)}">`;
}

function removerPreview(inputId, previewId, buttonId, removerId) {
  document.getElementById(inputId).value = "";
  document.getElementById(removerId).value = "true";
  document.getElementById(previewId).classList.add("d-none");
  document.getElementById(buttonId).classList.add("d-none");
  document.getElementById(previewId).innerHTML = "";
}

let autoSaveTimer = null;
function iniciarAutoSave() {
  if (!form) return;
  form.addEventListener("input", () => {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      if (document.getElementById("status").value !== "publicado") {
        salvarNoticiaSilenciosamente();
      }
    }, 10000);
  });
}

async function salvarNoticiaSilenciosamente() {
  sincronizarConteudoEditor();
  if (
    !conteudoCampo.value.trim() &&
    !document.getElementById("titulo").value.trim()
  )
    return;

  const id = document.getElementById("noticia-id").value;
  const dados = new FormData(form);
  dados.set(
    "destaque",
    document.getElementById("destaque").checked ? "true" : "false",
  );
  dados.set("removerImagem", removerImagem.value);
  dados.set("status", "rascunho");

  if (fonteImagemAtual === "url") {
    dados.delete("imagem");
    dados.set("imagemUrl", inputImagemUrl?.value.trim() || "");
  } else if (fonteImagemAtual === "galeria") {
    dados.delete("imagem");
    dados.set(
      "imagemUrl",
      document.getElementById("imagemGaleriaUrl")?.value || "",
    );
  } else {
    dados.delete("imagemUrl");
  }

  try {
    const resposta = await fetch(id ? `/api/noticias/${id}` : "/api/noticias", {
      method: id ? "PUT" : "POST",
      body: dados,
    });
    if (resposta.ok) {
      const nova = await resposta.json();
      document.getElementById("noticia-id").value = nova.id;
      mostrarToast("Rascunho salvo automaticamente", "success");
      carregarListaAdmin();
    }
  } catch (e) {}
}

async function carregarListaAdmin() {
  lista.innerHTML =
    '<tr><td colspan="4" class="text-secondary">Carregando...</td></tr>';
  const listaRss = document.getElementById("lista-admin-rss");
  if (listaRss)
    listaRss.innerHTML =
      '<tr><td colspan="4" class="text-secondary">Carregando...</td></tr>';

  try {
    const resposta = await fetch("/api/noticias?admin=true");
    if (resposta.status === 401) {
      window.location.href = "login.html";
      return;
    }

    noticiasCache = await resposta.json();

    if (!Array.isArray(noticiasCache)) {
      throw new Error(noticiasCache.erro || "Formato de dados inválido.");
    }

    // Filtra estritamente o FogãoNET para a nova aba do painel
    const noticiasRss = noticiasCache.filter(
      (n) => n.isRss && n.portal === "FOGÃONET",
    );

    document.getElementById("admin-count").textContent =
      `${noticiasCache.length} item(ns)`;
    const countRssEl = document.getElementById("rss-count");
    if (countRssEl) countRssEl.textContent = `${noticiasRss.length} item(ns)`;

    atualizarDashboard();
    atualizarGaleria();

    const dashNoticias = document.getElementById("dash-noticias");
    if (dashNoticias) dashNoticias.textContent = noticiasCache.length;

    const containerPortais = document.getElementById("filtros-rss-portais");
    if (containerPortais) {
      const selecionadosAntes = Array.from(
        document.querySelectorAll(".chk-filtro-portal:checked"),
      ).map((c) => c.value);
      const portaisAtivos = [
        ...new Set(
          noticiasCache.filter((n) => n.isRss && n.portal).map((n) => n.portal),
        ),
      ].sort();

      if (portaisAtivos.length > 0) {
        containerPortais.innerHTML = portaisAtivos
          .map(
            (p) => `
          <div class="form-check form-check-inline m-0 d-flex align-items-center gap-1">
            <input class="form-check-input chk-filtro-portal m-0" type="checkbox" id="chk-portal-${escapeAttr(p)}" value="${escapeAttr(p)}" ${selecionadosAntes.includes(p) ? "checked" : ""} style="cursor:pointer;">
            <label class="form-check-label fw-bold text-secondary" for="chk-portal-${escapeAttr(p)}" style="cursor:pointer; margin-top:2px;">${escapeHtml(p)}</label>
          </div>
        `,
          )
          .join("");

        document.querySelectorAll(".chk-filtro-portal").forEach((chk) => {
          chk.addEventListener("change", aplicarFiltrosTabelaNoticias);
        });
      } else {
        containerPortais.innerHTML =
          '<span class="text-muted">Nenhum portal em cache.</span>';
      }
    }

    if (!noticiasCache.length) {
      lista.innerHTML =
        '<tr><td colspan="4" class="text-secondary">Nenhuma noticia cadastrada.</td></tr>';
    } else {
      lista.innerHTML = noticiasCache
        .map((noticia) => {
          let tipo = "locais";
          if (noticia.isRss) tipo = "rss";
          else if (noticia.categoria === "Resumo do Canal do TF") tipo = "robo";

          if (noticia.isRss) {
            return `
              <tr class="table-light noticia-row" data-tipo="${tipo}" data-portal="${escapeAttr(noticia.portal)}">
                <td>
                  <strong>${escapeHtml(noticia.titulo)}</strong>
                  <div class="admin-row-meta mt-1">
                    <span class="badge bg-info text-dark">RSS</span>
                    <span>${escapeHtml(noticia.portal)}</span>
                  </div>
                </td>
                <td>${escapeHtml(noticia.categoria || "Geral")}</td>
                <td>N/A</td>
                <td class="text-end">
                  <a class="btn btn-outline-dark btn-sm" href="${escapeHtml(noticia.linkExterno)}" target="_blank">Abrir</a>
                  <button type="button" class="btn btn-outline-secondary btn-sm" onclick="editarNoticia('${noticia.id}')">Editar</button>
                  <button type="button" class="btn btn-outline-danger btn-sm" disabled>Excluir</button>
                </td>
              </tr>
            `;
          }

          const badgeRobo =
            tipo === "robo"
              ? `<span class="badge" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; box-shadow: 0 2px 4px rgba(245,158,11,0.2);">🤖 Robô TF</span>`
              : "";
          const rowStyle =
            tipo === "robo"
              ? "background-color: rgba(245, 158, 11, 0.05);"
              : "";

          return `
            <tr class="noticia-row" data-tipo="${tipo}" data-portal="" style="${rowStyle}">
              <td>
                <strong>${escapeHtml(noticia.titulo)}</strong>
                <div class="admin-row-meta align-items-center mt-1">
                  ${badgeRobo}
                  <span>${escapeHtml(noticia.slug || noticia.id)}</span>
                  <span>${noticia.status === "rascunho" ? "Rascunho" : "Publicado"}</span>
                  ${noticia.destaqueCarousel ? '<span class="badge text-bg-dark">Destaque</span>' : ""}
                </div>
              </td>
              <td>${escapeHtml(noticia.categoria || "Geral")}</td>
              <td>${noticia.visualizacoes || 0}</td>
              <td class="text-end">
                <a class="btn btn-outline-dark btn-sm" href="/noticia/${encodeURIComponent(noticia.slug || noticia.id)}" target="_blank">Abrir</a>
                <button type="button" class="btn btn-outline-secondary btn-sm" onclick="editarNoticia('${noticia.id}')">Editar</button>
                <button type="button" class="btn btn-outline-danger btn-sm" onclick="excluirNoticia('${noticia.id}')">Excluir</button>
              </td>
            </tr>
          `;
        })
        .join("");
    }

    if (listaRss) {
      if (!noticiasRss.length) {
        listaRss.innerHTML =
          '<tr><td colspan="4" class="text-secondary">Nenhuma matéria no cache do RSS.</td></tr>';
      } else {
        listaRss.innerHTML = noticiasRss
          .map((noticia) => {
            const dataFmt = new Date(noticia.data).toLocaleDateString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            });
            return `
            <tr>
              <td>
                ${noticia.imagemUrl ? `<img src="${escapeHtml(noticia.imagemUrl)}" style="width: 50px; height: 35px; object-fit: cover; border-radius: 4px;" alt="">` : `<div style="width: 50px; height: 35px; background: #e9ecef; border-radius: 4px;"></div>`}
              </td>
              <td>
                <strong class="d-block text-truncate" style="max-width: 350px;">${escapeHtml(noticia.titulo)}</strong>
                <div class="admin-row-meta mt-1">
                  <span class="badge bg-info text-dark" style="font-size: 0.6rem;">RSS</span>
                  <span>${escapeHtml(noticia.portal)}</span>
                </div>
              </td>
              <td class="text-muted small">${dataFmt}</td>
              <td class="text-end">
                <a class="btn btn-outline-dark btn-sm" href="${escapeHtml(noticia.linkExterno)}" target="_blank">Abrir Original</a>
                <button type="button" class="btn btn-outline-secondary btn-sm" onclick="editarNoticia('${noticia.id}')">Editar</button>
              </td>
            </tr>
          `;
          })
          .join("");
      }
    }
  } catch (err) {
    console.error("Erro em carregarListaAdmin:", err);
    lista.innerHTML = `<tr><td colspan="4" class="text-danger">Erro ao carregar noticias: ${err.message}</td></tr>`;
    if (listaRss)
      listaRss.innerHTML = `<tr><td colspan="4" class="text-danger">Erro ao carregar RSS: ${err.message}</td></tr>`;
  }
}

window.carregarCacheRss = async function () {
  await carregarListaAdmin();
  mostrarToast("Cache do RSS atualizado na tela.", "success");
};

function atualizarDashboard() {
  const dashViews = document.getElementById("dash-views");
  const dashArtigos = document.getElementById("dash-artigos");
  const dashTopNoticia = document.getElementById("dash-top-noticia");
  const dashTopViews = document.getElementById("dash-top-views");
  if (!dashViews || !noticiasCache) return;
  const publicadas = noticiasCache.filter(
    (n) => n.status !== "rascunho" && !n.isRss,
  );
  dashArtigos.textContent = publicadas.length;
  const totalViews = publicadas.reduce(
    (sum, n) => sum + (n.visualizacoes || 0),
    0,
  );
  dashViews.textContent = totalViews;
  if (publicadas.length > 0) {
    const top = [...publicadas].sort(
      (a, b) => (b.visualizacoes || 0) - (a.visualizacoes || 0),
    )[0];
    dashTopNoticia.textContent = top.titulo;
    dashTopViews.textContent = `${top.visualizacoes || 0} visualizações`;
  }
  atualizarGraficoPortais();
}

function atualizarGaleria() {
  const grid = document.getElementById("grid-galeria");
  if (!grid) return;
  const urls = [
    ...new Set(
      noticiasCache
        .filter(
          (n) => !n.isRss && n.imagemUrl && n.imagemUrl.startsWith("/uploads"),
        )
        .map((n) => n.imagemUrl),
    ),
  ];
  grid.innerHTML = urls
    .map(
      (url) => `
    <div class="col-4 col-md-3">
      <div class="ratio ratio-1x1 border rounded bg-light" style="cursor: pointer;" onclick="selecionarImagemGaleria('${url}')">
        <img src="${url}" class="object-fit-cover rounded" alt="">
      </div>
    </div>
  `,
    )
    .join("");
}

let chartPortaisInstance = null;
async function atualizarGraficoPortais() {
  const ctx = document.getElementById("chart-portais");
  const tipo = document.getElementById("chart-tipo")?.value || "bar";
  const periodo = document.getElementById("chart-periodo")?.value || "sempre";

  if (!ctx || !noticiasCache || typeof Chart === "undefined") return;

  let contagem = {};

  if (periodo === "sempre") {
    try {
      const resposta = await fetch("/api/estatisticas");
      if (resposta.ok) {
        const stats = await resposta.json();
        contagem = stats.totais || {};
      }
    } catch (e) {
      const rssNoticias = noticiasCache.filter((n) => n.isRss && n.portal);
      rssNoticias.forEach((n) => {
        contagem[n.portal] = (contagem[n.portal] || 0) + 1;
      });
    }
  } else {
    // Filtragem de tempo baseada no cache em memória
    const agora = new Date();
    const rssNoticias = noticiasCache.filter((n) => {
      if (!n.isRss || !n.portal || !n.data) return false;
      const d = new Date(n.data);
      if (periodo === "ano") {
        return d.getFullYear() === agora.getFullYear();
      } else if (!isNaN(parseInt(periodo))) {
        return (
          d.getMonth() === parseInt(periodo) &&
          d.getFullYear() === agora.getFullYear()
        );
      }
      return true;
    });
    rssNoticias.forEach((n) => {
      contagem[n.portal] = (contagem[n.portal] || 0) + 1;
    });
  }

  const labels = Object.keys(contagem).sort(
    (a, b) => contagem[b] - contagem[a],
  );
  const data = labels.map((l) => contagem[l]);

  // Paleta de Cores Dinâmica para os gráficos de Pizza/Rosca
  const coresBase = [
    "#0f766e",
    "#f59e0b",
    "#3b82f6",
    "#ef4444",
    "#8b5cf6",
    "#10b981",
    "#f97316",
    "#6366f1",
    "#ec4899",
  ];
  const bgColors = labels.map((_, i) => coresBase[i % coresBase.length]);

  if (chartPortaisInstance) chartPortaisInstance.destroy();

  chartPortaisInstance = new Chart(ctx, {
    type: tipo,
    data: {
      labels,
      datasets: [
        {
          label: "Matérias Publicadas",
          data,
          backgroundColor: bgColors,
          borderRadius: tipo === "bar" ? 4 : 0,
          borderWidth: tipo === "bar" ? 0 : 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } }, // Removemos a nativa para usar a de logos
      scales:
        tipo === "bar"
          ? { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
          : undefined,
      cutout: tipo === "doughnut" ? "65%" : undefined,
    },
  });

  // Renderizar a Legenda Customizada com as Logomarcas
  const legendContainer = document.getElementById("chart-custom-legend");
  if (legendContainer) {
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

    if (labels.length === 0) {
      legendContainer.innerHTML =
        '<span class="text-muted small">Nenhum dado encontrado para o período selecionado.</span>';
      return;
    }

    legendContainer.innerHTML = labels
      .map((label, index) => {
        const url = dominios[label] || "google.com";
        const logo = `https://www.google.com/s2/favicons?domain=${url}&sz=128`;
        const cor = bgColors[index];
        return `
        <div class="d-flex align-items-center gap-2 border rounded-pill px-3 py-1 shadow-sm bg-light" style="color: var(--ink);">
          <img src="${logo}" style="width: 16px; height: 16px; object-fit: contain; border-radius: 2px;" alt="">
          <span class="fw-bold small" style="font-size: 0.75rem;">${escapeHtml(label)}</span>
          <span class="badge rounded-pill" style="background-color: ${cor}; font-size: 0.7rem;">${data[index]}</span>
        </div>
      `;
      })
      .join("");
  }
}

window.selecionarImagemGaleria = function (url) {
  const inputGaleria = document.getElementById("imagemGaleriaUrl");
  if (inputGaleria) inputGaleria.value = url;
  document.getElementById("remover-imagem").value = "false";
  mostrarPreviewImagem(url, "Imagem da Galeria");
  const modal = bootstrap.Modal.getInstance(
    document.getElementById("modalGaleria"),
  );
  if (modal) modal.hide();
};

function inicializarEditorTexto() {
  if (!conteudoEditor || !editorToolbar) return;

  editorToolbar.addEventListener("click", (event) => {
    const botao = event.target.closest("[data-cmd]");
    if (!botao) return;
    event.preventDefault();

    conteudoEditor.focus();
    const cmd = botao.dataset.cmd;
    const valor = botao.dataset.value || null;

    if (cmd === "createLink") {
      const url = prompt("Informe a URL do link:");
      if (url) document.execCommand("createLink", false, url);
      return;
    }

    if (cmd === "insertImage") {
      const url = prompt("Informe a URL da imagem externa:");
      if (url) document.execCommand("insertImage", false, url);
      return;
    }

    if (cmd === "insertVideo") {
      const url = prompt("Cole o link do vídeo do YouTube:");
      if (url) {
        const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/);
        if (match && match[1]) {
          const embedUrl = `https://www.youtube.com/embed/${match[1]}`;
          const iframeHtml = `<br><iframe width="100%" height="350" src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="border-radius: 8px;"></iframe><br><p></p>`;
          document.execCommand("insertHTML", false, iframeHtml);
        } else {
          mostrarToast(
            "Não foi possível reconhecer o link do YouTube.",
            "danger",
          );
        }
      }
      return;
    }

    if (cmd === "formatBlock" && valor) {
      document.execCommand(cmd, false, valor);
      return;
    }

    document.execCommand(cmd, false, valor);
  });

  conteudoEditor.addEventListener("input", sincronizarConteudoEditor);
}

function sincronizarConteudoEditor() {
  if (!conteudoCampo || !conteudoEditor) return;
  const texto = conteudoEditor.innerText.replace(/\u00a0/g, " ").trim();
  conteudoCampo.value = texto ? conteudoEditor.innerHTML.trim() : "";
}

function definirConteudoEditor(html = "") {
  if (!conteudoEditor) return;
  conteudoEditor.innerHTML = html || "";
  sincronizarConteudoEditor();
}

function inicializarFonteImagem() {
  document.querySelectorAll("[data-image-source]").forEach((botao) => {
    botao.addEventListener("click", () =>
      alternarFonteImagem(botao.dataset.imageSource),
    );
  });
}

function alternarFonteImagem(fonte = "upload") {
  fonteImagemAtual = fonte;
  document.querySelectorAll("[data-image-source]").forEach((botao) => {
    botao.classList.toggle("is-active", botao.dataset.imageSource === fonte);
  });
  document
    .getElementById("painel-imagem-upload")
    ?.classList.toggle("d-none", fonte !== "upload");
  document
    .getElementById("painel-imagem-url")
    ?.classList.toggle("d-none", fonte !== "url");
  document
    .getElementById("painel-imagem-galeria")
    ?.classList.toggle("d-none", fonte !== "galeria");
  if (fonte !== "url") if (inputImagemUrl) inputImagemUrl.value = "";
  if (fonte !== "upload") if (inputImagem) inputImagem.value = "";
  if (fonte !== "galeria") {
    const inputGaleria = document.getElementById("imagemGaleriaUrl");
    if (inputGaleria) inputGaleria.value = "";
  }
}

function atualizarPreviewUrl() {
  const url = inputImagemUrl?.value.trim();
  if (!url) {
    if (removerImagem.value !== "true") esconderPreviewImagem();
    return;
  }
  removerImagem.value = "false";
  mostrarPreviewImagem(url, "Imagem externa");
}

async function salvarNoticia(event) {
  event.preventDefault();
  sincronizarConteudoEditor();

  if (!conteudoCampo.value.trim()) {
    mostrarToast("Preencha o texto da materia.", "danger");
    conteudoEditor?.focus();
    return;
  }

  btnSubmit.disabled = true;
  btnSubmit.textContent = "Salvando...";

  const id = document.getElementById("noticia-id").value;
  const dados = new FormData(form);
  dados.set(
    "destaque",
    document.getElementById("destaque").checked ? "true" : "false",
  );
  dados.set("removerImagem", removerImagem.value);

  if (fonteImagemAtual === "url") {
    dados.delete("imagem");
    dados.set("imagemUrl", inputImagemUrl?.value.trim() || "");
  } else if (fonteImagemAtual === "galeria") {
    dados.delete("imagem");
    dados.set(
      "imagemUrl",
      document.getElementById("imagemGaleriaUrl")?.value || "",
    );
  } else {
    dados.delete("imagemUrl");
  }

  try {
    const resposta = await fetch(id ? `/api/noticias/${id}` : "/api/noticias", {
      method: id ? "PUT" : "POST",
      body: dados,
    });

    if (!resposta.ok) throw new Error("Falha ao salvar");
    mostrarToast("Noticia salva com sucesso!");

    limparFormulario();
    await carregarListaAdmin();
    await inicializarSeletorCarrossel();

    // Pula para a aba da lista para o usuário ver o resultado
    const tabNoticiasLista = document.getElementById("tab-noticias-lista");
    if (tabNoticiasLista && window.bootstrap) {
      bootstrap.Tab.getOrCreateInstance(tabNoticiasLista).show();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch {
    mostrarToast("Nao foi possivel salvar a noticia.", "danger");
  } finally {
    const editando = Boolean(document.getElementById("noticia-id").value);
    btnSubmit.disabled = false;
    btnSubmit.textContent = editando ? "Atualizar noticia" : "Publicar noticia";
  }
}

function editarNoticia(id) {
  const noticia = noticiasCache.find((item) => String(item.id) === String(id));
  if (!noticia) return;

  document.getElementById("noticia-id").value = noticia.id;
  document.getElementById("titulo").value = noticia.titulo || "";
  document.getElementById("resumo").value = noticia.resumo || "";
  definirConteudoEditor(noticia.conteudo || noticia.resumo || "");
  document.getElementById("categoria").value = noticia.categoria || "Geral";

  const autorVal = noticia.autor || "Redacao";
  const selectAutor = document.getElementById("autor");
  if (selectAutor) {
    if (
      !Array.from(selectAutor.options).some((opt) => opt.value === autorVal)
    ) {
      selectAutor.innerHTML += `<option value="${escapeHtml(autorVal)}">${escapeHtml(autorVal)}</option>`;
    }
    selectAutor.value = autorVal;
  }

  document.getElementById("tags").value = Array.isArray(noticia.tags)
    ? noticia.tags.join(", ")
    : "";
  document.getElementById("status").value =
    noticia.status === "rascunho" ? "rascunho" : "publicado";
  document.getElementById("destaque").checked = Boolean(
    noticia.destaqueCarousel,
  );
  removerImagem.value = "false";

  if (noticia.imagemUrl) {
    if (/^https?:\/\//i.test(noticia.imagemUrl)) {
      alternarFonteImagem("url");
      if (inputImagemUrl) inputImagemUrl.value = noticia.imagemUrl;
    } else if (noticia.imagemUrl.startsWith("/uploads")) {
      alternarFonteImagem("galeria");
      if (document.getElementById("imagemGaleriaUrl"))
        document.getElementById("imagemGaleriaUrl").value = noticia.imagemUrl;
    } else {
      alternarFonteImagem("upload");
    }
    mostrarPreviewImagem(noticia.imagemUrl, noticia.titulo);
  } else {
    alternarFonteImagem("upload");
    esconderPreviewImagem();
  }

  tituloForm.textContent = "Editar noticia";
  btnSubmit.textContent = "Atualizar noticia";
  btnCancelar.classList.remove("d-none");

  const tabNoticias = document.getElementById("tab-noticias");
  if (tabNoticias && window.bootstrap) {
    bootstrap.Tab.getOrCreateInstance(tabNoticias).show();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function excluirNoticia(id) {
  if (!confirm("Deseja excluir esta noticia?")) return;

  try {
    const resposta = await fetch(`/api/noticias/${id}`, { method: "DELETE" });
    if (!resposta.ok) throw new Error("Falha ao excluir");
    mostrarToast("Noticia excluida com sucesso!");
    await carregarListaAdmin();
  } catch {
    mostrarToast("Nao foi possivel excluir a noticia.", "danger");
  }
}

function atualizarPreviewArquivo() {
  const arquivo = inputImagem.files && inputImagem.files[0];
  if (!arquivo) return;
  alternarFonteImagem("upload");
  removerImagem.value = "false";
  if (inputImagemUrl) inputImagemUrl.value = "";
  mostrarPreviewImagem(URL.createObjectURL(arquivo), arquivo.name);
}

function mostrarPreviewImagem(src, alt) {
  previewImagem.classList.remove("d-none");
  btnRemoverImagem.classList.remove("d-none");
  previewImagem.innerHTML = `<img src="${src}" alt="${escapeHtml(alt)}">`;
}

function esconderPreviewImagem() {
  previewImagem.classList.add("d-none");
  btnRemoverImagem.classList.add("d-none");
  previewImagem.innerHTML = "";
}

function marcarImagemParaRemocao() {
  inputImagem.value = "";
  if (inputImagemUrl) inputImagemUrl.value = "";
  removerImagem.value = "true";
  esconderPreviewImagem();
}

function limparFormulario() {
  // Se o usuário estava editando e cancelou, devolvemos ele para a lista
  if (!btnCancelar.classList.contains("d-none")) {
    const tabNoticiasLista = document.getElementById("tab-noticias-lista");
    if (tabNoticiasLista && window.bootstrap) {
      bootstrap.Tab.getOrCreateInstance(tabNoticiasLista).show();
    }
  }

  form.reset();
  document.getElementById("noticia-id").value = "";
  document.getElementById("categoria").value = "Arena Alvinegra";
  document.getElementById("tags").value = "Arena Alvinegra";
  document.getElementById("autor").value = "Redacao";
  document.getElementById("status").value = "publicado";
  removerImagem.value = "false";
  alternarFonteImagem("upload");
  definirConteudoEditor("");
  esconderPreviewImagem();
  tituloForm.textContent = "Nova noticia";
  btnSubmit.textContent = "Publicar noticia";
  btnCancelar.classList.add("d-none");
}

async function carregarEnqueteAdmin() {
  try {
    const resposta = await fetch("/api/enquete");
    const enquete = await resposta.json();
    document.getElementById("pergunta-enquete").value = enquete.pergunta || "";
    document.getElementById("opcoes-enquete").value = Object.keys(
      enquete.opcoes || {},
    ).join(", ");
    document.getElementById("remover-imagem-enquete").value = "false";
    if (enquete.imagemUrl) {
      mostrarPreviewEnquete(enquete.imagemUrl);
    } else {
      esconderPreviewEnquete();
    }
    renderizarPreviewEnquete(enquete);
  } catch {
    document.getElementById("preview-enquete").innerHTML =
      '<div class="empty-box">Erro ao carregar enquete.</div>';
  }
}

async function salvarEnquete(event) {
  event.preventDefault();
  const form = document.getElementById("form-enquete");
  const dados = new FormData(form);

  const opcoes = document
    .getElementById("opcoes-enquete")
    .value.split(",")
    .map((opcao) => opcao.trim())
    .filter(Boolean);

  if (opcoes.length < 2) {
    mostrarToast("Informe pelo menos duas opcoes.", "danger");
    return;
  }

  dados.delete("opcoes");
  dados.append("opcoes", JSON.stringify(opcoes));

  const resposta = await fetch("/api/enquete/configurar", {
    method: "POST",
    body: dados,
  });

  if (!resposta.ok) {
    mostrarToast("Nao foi possivel salvar a enquete.", "danger");
    return;
  }

  mostrarToast("Enquete salva com sucesso.");
  renderizarPreviewEnquete(await resposta.json());
}

function renderizarPreviewEnquete(enquete) {
  const total = Object.values(enquete.opcoes || {}).reduce(
    (soma, votos) => soma + votos,
    0,
  );
  document.getElementById("preview-enquete").innerHTML = `
    <div class="game-box">
      <strong>${escapeHtml(enquete.pergunta || "")}</strong>
      <div class="mt-3">
        ${Object.entries(enquete.opcoes || {})
          .map(([opcao, votos]) => {
            const pct = total ? Math.round((votos / total) * 100) : 0;
            return `<div class="poll-result"><span>${escapeHtml(opcao)}</span><strong>${pct}%</strong></div>`;
          })
          .join("")}
      </div>
    </div>
  `;
}

async function carregarJogosAdmin() {
  const listaJogos = document.getElementById("lista-jogos-admin");
  listaJogos.innerHTML = '<div class="loading-box">Carregando jogos...</div>';

  try {
    const resposta = await fetch("/api/jogos");
    jogosCache = await resposta.json();
    document.getElementById("jogos-count").textContent =
      `${jogosCache.length} item(ns)`;

    const dashJogos = document.getElementById("dash-jogos");
    if (dashJogos) dashJogos.textContent = jogosCache.length;

    if (!jogosCache.length) {
      listaJogos.innerHTML =
        '<div class="empty-box">Nenhum jogo cadastrado.</div>';
      return;
    }

    listaJogos.innerHTML = jogosCache
      .map(
        (jogo) => `
      <div class="admin-game-row">
        <div>
          <strong class="d-flex align-items-center gap-2">
            ${jogo.escudoMandante ? `<img src="${escapeHtml(jogo.escudoMandante)}" style="width: 20px; height: 20px; object-fit: contain;">` : ""}
            ${escapeHtml(jogo.mandante)} x ${escapeHtml(jogo.visitante)}
            ${jogo.escudoVisitante ? `<img src="${escapeHtml(jogo.escudoVisitante)}" style="width: 20px; height: 20px; object-fit: contain;">` : ""}
          </strong>
          <span>${escapeHtml(jogo.campeonato)} - ${escapeHtml(formatarDataHoraInput(jogo.dataHora).replace("T", " "))}</span>
        </div>
        <div class="d-flex gap-2">
          <button type="button" class="btn btn-outline-secondary btn-sm" onclick="editarJogo('${jogo.id}')">Editar</button>
          <button type="button" class="btn btn-outline-danger btn-sm" onclick="excluirJogo('${jogo.id}')">Excluir</button>
        </div>
      </div>
    `,
      )
      .join("");
  } catch {
    listaJogos.innerHTML =
      '<div class="empty-box">Erro ao carregar jogos.</div>';
  }
}

async function salvarJogo(event) {
  event.preventDefault();
  const id = document.getElementById("jogo-id").value;
  const payload = {
    campeonato: document.getElementById("campeonato").value.trim(),
    dataHora: document.getElementById("dataHora").value,
    mandante: document.getElementById("mandante").value.trim(),
    visitante: document.getElementById("visitante").value.trim(),
    escudoMandante: document.getElementById("escudoMandante").value.trim(),
    escudoVisitante: document.getElementById("escudoVisitante").value.trim(),
    placarMandante: document.getElementById("placarMandante").value,
    placarVisitante: document.getElementById("placarVisitante").value,
  };

  const resposta = await fetch(id ? `/api/jogos/${id}` : "/api/jogos", {
    method: id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!resposta.ok) {
    mostrarToast("Nao foi possivel salvar o jogo.", "danger");
    return;
  }

  limparFormularioJogo();
  mostrarToast("Jogo salvo com sucesso.");
  carregarJogosAdmin();
}

function editarJogo(id) {
  const jogo = jogosCache.find((item) => String(item.id) === String(id));
  if (!jogo) return;

  document.getElementById("jogo-id").value = jogo.id;
  document.getElementById("campeonato").value = jogo.campeonato || "";
  document.getElementById("dataHora").value = formatarDataHoraInput(
    jogo.dataHora,
  );
  document.getElementById("mandante").value = jogo.mandante || "";
  document.getElementById("visitante").value = jogo.visitante || "";
  document.getElementById("escudoMandante").value = jogo.escudoMandante || "";
  document.getElementById("escudoVisitante").value = jogo.escudoVisitante || "";
  document.getElementById("placarMandante").value = jogo.placarMandante ?? "";
  document.getElementById("placarVisitante").value = jogo.placarVisitante ?? "";
  document.getElementById("titulo-form-jogo").textContent = "Editar jogo";
  document.getElementById("btn-submit-jogo").textContent = "Atualizar jogo";
  btnCancelarJogo.classList.remove("d-none");
}

async function excluirJogo(id) {
  if (!confirm("Deseja excluir este jogo?")) return;
  const resposta = await fetch(`/api/jogos/${id}`, { method: "DELETE" });
  if (!resposta.ok) {
    mostrarToast("Nao foi possivel excluir o jogo.", "danger");
    return;
  }
  mostrarToast("Jogo excluido com sucesso.");
  carregarJogosAdmin();
}

function limparFormularioJogo() {
  formJogo.reset();
  document.getElementById("jogo-id").value = "";
  document.getElementById("titulo-form-jogo").textContent = "Novo jogo";
  document.getElementById("btn-submit-jogo").textContent = "Salvar jogo";
  btnCancelarJogo.classList.add("d-none");
}

function formatarDataHoraInput(valor) {
  if (!valor) return "";
  return String(valor).slice(0, 16);
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

// --- SISTEMA DE PATROCINADORES ---
function mostrarPreviewPatrocinador(src) {
  const preview = document.getElementById("preview-patrocinador-imagem");
  const btnRemover = document.getElementById("btn-remover-imagem-patrocinador");
  preview.innerHTML = `<img src="${src}" style="max-height: 50px; background: #f0f0f0; padding: 5px; border-radius: 4px;" alt="Logo">`;
  preview.classList.remove("d-none");
  btnRemover.classList.remove("d-none");
}

function esconderPreviewPatrocinador() {
  const preview = document.getElementById("preview-patrocinador-imagem");
  const btnRemover = document.getElementById("btn-remover-imagem-patrocinador");
  preview.innerHTML = "";
  preview.classList.add("d-none");
  btnRemover.classList.add("d-none");
}

async function carregarPatrocinadoresAdmin() {
  const lista = document.getElementById("lista-patrocinadores-admin");
  if (!lista) return;
  lista.innerHTML =
    '<div class="loading-box">Carregando patrocinadores...</div>';

  try {
    const resposta = await fetch("/api/patrocinadores?admin=true");
    patrocinadoresCache = await resposta.json();
    const countEl = document.getElementById("patrocinadores-count");
    if (countEl) countEl.textContent = `${patrocinadoresCache.length} item(ns)`;

    if (!patrocinadoresCache.length) {
      lista.innerHTML =
        '<div class="empty-box">Nenhum patrocinador cadastrado.</div>';
      return;
    }

    lista.innerHTML = patrocinadoresCache
      .map(
        (p) => `
      <div class="admin-game-row align-items-center">
        <div class="d-flex align-items-center gap-3">
          ${p.tipo === "imagem" && p.imagemUrl ? `<img src="${p.imagemUrl}" style="max-height: 30px; max-width: 60px; object-fit: contain;">` : `<span class="badge bg-secondary">Botão</span>`}
          <div>
            <strong>${escapeHtml(p.nome)}</strong>
                <span class="d-flex align-items-center gap-2 mt-1"><span class="status-dot ${p.ativo === false ? "offline" : "online"}"></span> ${p.ativo === false ? "Inativo" : "Ativo"}${p.link ? ` <span class="text-muted mx-1">•</span> <a href="${escapeHtml(p.link)}" target="_blank" class="text-muted text-decoration-none">Link</a>` : ""}</span>
          </div>
        </div>
        <div class="d-flex gap-2">
          <button type="button" class="btn btn-outline-secondary btn-sm" onclick="editarPatrocinador('${p.id}')">Editar</button>
          <button type="button" class="btn btn-outline-danger btn-sm" onclick="excluirPatrocinador('${p.id}')">Excluir</button>
        </div>
      </div>
    `,
      )
      .join("");
  } catch {
    lista.innerHTML =
      '<div class="empty-box">Erro ao carregar patrocinadores.</div>';
  }
}

async function salvarPatrocinador(event) {
  event.preventDefault();
  const id = document.getElementById("patrocinador-id").value;
  const dados = new FormData();

  dados.append(
    "nome",
    document.getElementById("patrocinador-nome").value.trim(),
  );
  dados.append("tipo", document.getElementById("patrocinador-tipo").value);
  dados.append(
    "link",
    document.getElementById("patrocinador-link").value.trim(),
  );
  dados.append(
    "ativo",
    document.getElementById("patrocinador-ativo").checked ? "true" : "false",
  );
  dados.append(
    "removerImagem",
    document.getElementById("remover-imagem-patrocinador").value,
  );

  const inputImagem = document.getElementById("patrocinador-imagem");
  if (inputImagem.files[0]) dados.append("imagem", inputImagem.files[0]);

  const resposta = await fetch(
    id ? `/api/patrocinadores/${id}` : "/api/patrocinadores",
    {
      method: id ? "PUT" : "POST",
      body: dados,
    },
  );

  if (!resposta.ok)
    return mostrarToast("Nao foi possivel salvar o patrocinador.", "danger");

  limparFormularioPatrocinador();
  mostrarToast("Patrocinador salvo com sucesso.");
  carregarPatrocinadoresAdmin();
}

function editarPatrocinador(id) {
  const p = patrocinadoresCache.find((item) => String(item.id) === String(id));
  if (!p) return;
  document.getElementById("patrocinador-id").value = p.id;
  document.getElementById("patrocinador-nome").value = p.nome || "";
  document.getElementById("patrocinador-tipo").value = p.tipo || "texto";
  document.getElementById("patrocinador-link").value = p.link || "";
  document.getElementById("patrocinador-ativo").checked = p.ativo !== false;
  document.getElementById("remover-imagem-patrocinador").value = "false";

  const boxImagem = document.getElementById("box-imagem-patrocinador");
  if (p.tipo === "imagem") {
    boxImagem.classList.remove("d-none");
    p.imagemUrl
      ? mostrarPreviewPatrocinador(p.imagemUrl)
      : esconderPreviewPatrocinador();
  } else {
    boxImagem.classList.add("d-none");
    esconderPreviewPatrocinador();
  }

  document.getElementById("titulo-form-patrocinador").textContent =
    "Editar patrocinador";
  document.getElementById("btn-submit-patrocinador").textContent =
    "Atualizar patrocinador";
  document
    .getElementById("btn-cancelar-patrocinador")
    .classList.remove("d-none");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function excluirPatrocinador(id) {
  if (!confirm("Deseja excluir este patrocinador?")) return;
  const resposta = await fetch(`/api/patrocinadores/${id}`, {
    method: "DELETE",
  });
  if (!resposta.ok)
    return mostrarToast("Nao foi possivel excluir o patrocinador.", "danger");
  mostrarToast("Patrocinador excluido com sucesso.");
  carregarPatrocinadoresAdmin();
}

function limparFormularioPatrocinador() {
  document.getElementById("form-patrocinador")?.reset();
  document.getElementById("patrocinador-id").value = "";
  document.getElementById("patrocinador-ativo").checked = true;
  document.getElementById("remover-imagem-patrocinador").value = "false";
  document.getElementById("box-imagem-patrocinador").classList.add("d-none");
  esconderPreviewPatrocinador();
  document.getElementById("titulo-form-patrocinador").textContent =
    "Novo patrocinador";
  document.getElementById("btn-submit-patrocinador").textContent =
    "Salvar patrocinador";
  document.getElementById("btn-cancelar-patrocinador").classList.add("d-none");
}

async function carregarVideosAdmin() {
  const lista = document.getElementById("lista-videos-admin");
  if (!lista) return;
  lista.innerHTML = '<div class="loading-box">Carregando vídeos...</div>';
  try {
    const resposta = await fetch("/api/videos-gerenciador");
    videosCache = await resposta.json();
    const countEl = document.getElementById("videos-count");
    if (countEl) countEl.textContent = `${videosCache.length} item(ns)`;
    if (!videosCache.length) {
      lista.innerHTML = '<div class="empty-box">Nenhum vídeo cadastrado.</div>';
      return;
    }
    lista.innerHTML = videosCache
      .map(
        (v) => `
      <div class="admin-game-row align-items-center">
        <div class="d-flex align-items-center gap-3">
          ${v.thumbnail ? `<img src="${escapeHtml(v.thumbnail)}" style="width: 80px; height: 45px; object-fit: cover; border-radius: 4px;">` : ""}
          <div>
            <strong>${escapeHtml(v.titulo)}</strong>
                <span class="d-flex align-items-center gap-2 mt-1"><span class="status-dot ${v.ativo === false ? "offline" : "online"}"></span> ${v.ativo === false ? "Inativo" : "Ativo"}</span>
          </div>
        </div>
        <div class="d-flex gap-2">
          <button type="button" class="btn btn-outline-secondary btn-sm" onclick="editarVideo('${v.id}')">Editar</button>
          <button type="button" class="btn btn-outline-danger btn-sm" onclick="excluirVideo('${v.id}')">Excluir</button>
        </div>
      </div>
    `,
      )
      .join("");
  } catch {
    lista.innerHTML = '<div class="empty-box">Erro ao carregar vídeos.</div>';
  }
}

async function salvarVideo(event) {
  event.preventDefault();
  const id = document.getElementById("video-id").value;
  const payload = {
    titulo: document.getElementById("video-titulo").value.trim(),
    link: document.getElementById("video-link").value.trim(),
    thumbnail: document.getElementById("video-thumbnail").value.trim(),
    ativo: document.getElementById("video-ativo").checked,
  };
  const resposta = await fetch(
    id ? `/api/videos-gerenciador/${id}` : "/api/videos-gerenciador",
    {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!resposta.ok)
    return mostrarToast("Não foi possível salvar o vídeo.", "danger");
  limparFormularioVideo();
  mostrarToast("Vídeo salvo com sucesso.");
  carregarVideosAdmin();
}

function editarVideo(id) {
  const v = videosCache.find((item) => String(item.id) === String(id));
  if (!v) return;
  document.getElementById("video-id").value = v.id;
  document.getElementById("video-titulo").value = v.titulo || "";
  document.getElementById("video-link").value = v.link || "";
  document.getElementById("video-thumbnail").value = v.thumbnail || "";
  document.getElementById("video-ativo").checked = v.ativo !== false;
  if (v.thumbnail) {
    document.getElementById("preview-video-thumb").innerHTML =
      `<img src="${v.thumbnail}" class="img-fluid rounded shadow-sm">`;
    document.getElementById("preview-video-thumb").classList.remove("d-none");
  } else {
    document.getElementById("preview-video-thumb").classList.add("d-none");
  }
  document.getElementById("titulo-form-video").textContent = "Editar vídeo";
  document.getElementById("btn-submit-video").textContent = "Atualizar vídeo";
  document.getElementById("btn-cancelar-video").classList.remove("d-none");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function excluirVideo(id) {
  if (!confirm("Deseja excluir este vídeo?")) return;
  const resposta = await fetch(`/api/videos-gerenciador/${id}`, {
    method: "DELETE",
  });
  if (!resposta.ok) return mostrarToast("Erro ao excluir o vídeo.", "danger");
  mostrarToast("Vídeo excluído.");
  carregarVideosAdmin();
}

function limparFormularioVideo() {
  document.getElementById("form-video")?.reset();
  document.getElementById("video-id").value = "";
  document.getElementById("video-ativo").checked = true;
  document.getElementById("preview-video-thumb").innerHTML = "";
  document.getElementById("preview-video-thumb").classList.add("d-none");
  document.getElementById("titulo-form-video").textContent = "Novo vídeo";
  document.getElementById("btn-submit-video").textContent = "Salvar vídeo";
  document.getElementById("btn-cancelar-video").classList.add("d-none");
}

async function carregarAutoresAdmin() {
  const lista = document.getElementById("lista-autores-admin");
  if (!lista) return;
  lista.innerHTML = '<div class="loading-box">Carregando autores...</div>';
  try {
    const resposta = await fetch("/api/autores");
    autoresCache = await resposta.json();
    const countEl = document.getElementById("autores-count");
    if (countEl) countEl.textContent = `${autoresCache.length} / 12`;

    preencherSelectAutores();

    if (!autoresCache.length) {
      lista.innerHTML = '<div class="empty-box">Nenhum autor cadastrado.</div>';
      return;
    }
    lista.innerHTML = autoresCache
      .map(
        (a, index) => `
      <div class="admin-game-row align-items-center">
        <div class="d-flex align-items-center gap-3">
          ${a.imagemUrl ? `<img src="${escapeHtml(a.imagemUrl)}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 50%;">` : `<div style="width:40px; height:40px; border-radius:50%; background:#ccc;"></div>`}
          <div class="d-flex flex-column">
            <div class="d-flex align-items-center gap-1">
              <strong>${escapeHtml(a.nome)}</strong>
              ${a.verificado ? '<svg viewBox="0 0 24 24" width="16" height="16" fill="#1d9bf0"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.918-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.918-1.79-3.918 4 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.46.733 2.73 1.843 3.45-.035.18-.054.36-.054.55 0 2.21 1.71 3.998 3.918 3.998.47 0 .92-.084 1.336-.25C8.49 21.585 9.798 22.5 11.318 22.5s2.816-.917 3.337-2.25c.416.165.866.25 1.336.25 2.21 0 3.918-1.79 3.918-4 0-.19-.02-.37-.054-.55 1.11-.72 1.843-1.99 1.843-3.45zm-11.46 5.31l-4.25-4.25 1.41-1.41 2.84 2.84 7.15-7.15 1.41 1.41-8.56 8.56z"></path></svg>' : ""}
            </div>
            ${a.arroba ? `<span class="text-muted small" style="line-height: 1;">${escapeHtml(a.arroba)}</span>` : ""}
          </div>
        </div>
        <div class="d-flex gap-2">
          <div class="btn-group btn-group-sm">
            <button type="button" class="btn btn-outline-secondary" onclick="moverAutor('${a.id}', -1)" ${index === 0 ? "disabled" : ""} title="Mover para esquerda no site">↑</button>
            <button type="button" class="btn btn-outline-secondary" onclick="moverAutor('${a.id}', 1)" ${index === autoresCache.length - 1 ? "disabled" : ""} title="Mover para direita no site">↓</button>
          </div>
          <button type="button" class="btn btn-outline-secondary btn-sm" onclick="editarAutor('${a.id}')">Editar</button>
          <button type="button" class="btn btn-outline-danger btn-sm" onclick="excluirAutor('${a.id}')">Excluir</button>
        </div>
      </div>
    `,
      )
      .join("");
  } catch {
    lista.innerHTML = '<div class="empty-box">Erro ao carregar autores.</div>';
  }
}

async function salvarAutor(event) {
  event.preventDefault();
  const id = document.getElementById("autor-id").value;
  const dados = new FormData();
  dados.append("nome", document.getElementById("autor-nome").value.trim());
  dados.append("arroba", document.getElementById("autor-arroba").value.trim());
  dados.append("redes", document.getElementById("autor-redes").value.trim());
  dados.append(
    "removerImagem",
    document.getElementById("remover-imagem-autor").value,
  );
  dados.append(
    "verificado",
    document.getElementById("autor-verificado").checked ? "true" : "false",
  );
  const inputImagem = document.getElementById("autor-imagem");
  if (inputImagem.files[0]) dados.append("imagem", inputImagem.files[0]);
  const resposta = await fetch(id ? `/api/autores/${id}` : "/api/autores", {
    method: id ? "PUT" : "POST",
    body: dados,
  });
  if (!resposta.ok) {
    const err = await resposta.json().catch(() => ({}));
    return mostrarToast(
      err.erro || "Não foi possível salvar o autor.",
      "danger",
    );
  }
  limparFormularioAutor();
  mostrarToast("Autor salvo com sucesso.");
  carregarAutoresAdmin();
}

function editarAutor(id) {
  const a = autoresCache.find((item) => String(item.id) === String(id));
  if (!a) return;
  document.getElementById("autor-id").value = a.id;
  document.getElementById("autor-nome").value = a.nome || "";
  document.getElementById("autor-arroba").value = a.arroba || "";
  document.getElementById("autor-redes").value = a.redes || "";
  document.getElementById("remover-imagem-autor").value = "false";
  document.getElementById("autor-verificado").checked = a.verificado === true;
  const preview = document.getElementById("preview-autor-imagem");
  const btnRemover = document.getElementById("btn-remover-imagem-autor");
  if (a.imagemUrl) {
    preview.innerHTML = `<img src="${a.imagemUrl}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 50%;" class="shadow-sm">`;
    preview.classList.remove("d-none");
    btnRemover.classList.remove("d-none");
  } else {
    preview.classList.add("d-none");
    btnRemover.classList.add("d-none");
  }
  document.getElementById("titulo-form-autor").textContent = "Editar autor";
  document.getElementById("btn-submit-autor").textContent = "Atualizar autor";
  document.getElementById("btn-cancelar-autor").classList.remove("d-none");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function excluirAutor(id) {
  if (!confirm("Deseja excluir este autor?")) return;
  const resposta = await fetch(`/api/autores/${id}`, { method: "DELETE" });
  if (!resposta.ok) return mostrarToast("Erro ao excluir autor.", "danger");
  mostrarToast("Autor excluído.");
  carregarAutoresAdmin();
}

function preencherSelectAutores() {
  const selectAutor = document.getElementById("autor");
  if (!selectAutor) return;

  const valorAtual = selectAutor.value || "Redacao";
  let html = '<option value="Redacao">Redação</option>';

  autoresCache.forEach((autor) => {
    html += `<option value="${escapeHtml(autor.nome)}">${escapeHtml(autor.nome)}</option>`;
  });

  selectAutor.innerHTML = html;

  if (Array.from(selectAutor.options).some((opt) => opt.value === valorAtual)) {
    selectAutor.value = valorAtual;
  } else if (valorAtual !== "Redacao") {
    selectAutor.innerHTML += `<option value="${escapeHtml(valorAtual)}">${escapeHtml(valorAtual)}</option>`;
    selectAutor.value = valorAtual;
  }
}

function limparFormularioAutor() {
  document.getElementById("form-autor")?.reset();
  document.getElementById("autor-id").value = "";
  document.getElementById("remover-imagem-autor").value = "false";
  document.getElementById("autor-verificado").checked = false;
  document.getElementById("autor-arroba").value = "";
  document.getElementById("autor-redes").value = "";
  document.getElementById("preview-autor-imagem").innerHTML = "";
  document.getElementById("preview-autor-imagem").classList.add("d-none");
  document.getElementById("btn-remover-imagem-autor").classList.add("d-none");
  document.getElementById("titulo-form-autor").textContent = "Novo autor";
  document.getElementById("btn-submit-autor").textContent = "Salvar autor";
  document.getElementById("btn-cancelar-autor").classList.add("d-none");
}

async function moverAutor(id, dir) {
  const idx = autoresCache.findIndex((a) => String(a.id) === String(id));
  if (idx === -1) return;
  const novoIdx = idx + dir;
  if (novoIdx < 0 || novoIdx >= autoresCache.length) return;

  const temp = autoresCache[idx];
  autoresCache[idx] = autoresCache[novoIdx];
  autoresCache[novoIdx] = temp;

  const ids = autoresCache.map((a) => a.id);
  try {
    const resposta = await fetch("/api/autores/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (!resposta.ok) throw new Error();
    carregarAutoresAdmin();
  } catch (error) {
    mostrarToast("Erro ao reordenar autores.", "danger");
  }
}

async function carregarUsuariosAdmin() {
  const lista = document.getElementById("lista-usuarios-admin");
  if (!lista) return;
  lista.innerHTML = '<div class="loading-box">Carregando usuários...</div>';

  try {
    const resposta = await fetch("/api/usuarios");
    usuariosCache = await resposta.json();
    const countEl = document.getElementById("usuarios-count");
    if (countEl) countEl.textContent = `${usuariosCache.length} item(ns)`;

    if (!usuariosCache.length) {
      lista.innerHTML =
        '<div class="empty-box">Nenhum usuário cadastrado.</div>';
      return;
    }

    lista.innerHTML = usuariosCache
      .map(
        (u) => `
      <div class="admin-game-row align-items-center">
        <div>
          <strong>${escapeHtml(u.usuario)}</strong>
          <span class="badge bg-secondary ms-2">${escapeHtml(u.role)}</span>
        </div>
        <div class="d-flex gap-2">
          <button type="button" class="btn btn-outline-secondary btn-sm" onclick="editarUsuario('${u.id}')">Editar</button>
          <button type="button" class="btn btn-outline-danger btn-sm" onclick="excluirUsuario('${u.id}')">Excluir</button>
        </div>
      </div>
    `,
      )
      .join("");
  } catch (e) {
    lista.innerHTML = '<div class="empty-box">Erro ao carregar usuários.</div>';
  }
}

async function salvarUsuario(event) {
  event.preventDefault();
  const id = document.getElementById("usuario-id").value;
  const payload = {
    usuario: document.getElementById("usuario-nome").value.trim(),
    senha: document.getElementById("usuario-senha").value.trim(),
    role: document.getElementById("usuario-role").value,
  };

  try {
    const resposta = await fetch(id ? `/api/usuarios/${id}` : "/api/usuarios", {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resposta.ok) {
      const err = await resposta.json();
      return mostrarToast(
        err.erro || "Não foi possível salvar o usuário.",
        "danger",
      );
    }

    limparFormularioUsuario();
    mostrarToast("Usuário salvo com sucesso.");
    carregarUsuariosAdmin();
  } catch (e) {
    mostrarToast("Erro ao conectar com servidor.", "danger");
  }
}

window.editarUsuario = function (id) {
  const u = usuariosCache.find((x) => String(x.id) === String(id));
  if (!u) return;
  document.getElementById("usuario-id").value = u.id;
  document.getElementById("usuario-nome").value = u.usuario || "";
  document.getElementById("usuario-senha").value = u.senha || "";
  document.getElementById("usuario-role").value = u.role || "usuario";

  document.getElementById("titulo-form-usuario").textContent = "Editar usuário";
  document.getElementById("btn-submit-usuario").textContent =
    "Atualizar usuário";
  btnCancelarUsuario.classList.remove("d-none");
  window.scrollTo({ top: 0, behavior: "smooth" });
};

window.excluirUsuario = async function (id) {
  if (!confirm("Deseja excluir este usuário?")) return;
  const resposta = await fetch(`/api/usuarios/${id}`, { method: "DELETE" });
  if (!resposta.ok) {
    const err = await resposta.json();
    return mostrarToast(
      err.erro || "Não foi possível excluir o usuário.",
      "danger",
    );
  }
  mostrarToast("Usuário excluído.");
  carregarUsuariosAdmin();
};

function limparFormularioUsuario() {
  formUsuario.reset();
  document.getElementById("usuario-id").value = "";
  document.getElementById("titulo-form-usuario").textContent = "Novo usuário";
  document.getElementById("btn-submit-usuario").textContent = "Criar usuário";
  btnCancelarUsuario.classList.add("d-none");
}

async function carregarTabelasAdmin() {
  const lista = document.getElementById("lista-tabelas-admin");
  if (!lista) return;
  lista.innerHTML = '<div class="loading-box">Carregando tabelas...</div>';
  try {
    const resposta = await fetch("/api/tabelas");
    tabelasCache = await resposta.json();
    const countEl = document.getElementById("tabelas-count");
    if (countEl) countEl.textContent = `${tabelasCache.length} item(ns)`;

    if (!tabelasCache.length) {
      lista.innerHTML =
        '<div class="empty-box">Nenhuma tabela cadastrada.</div>';
      return;
    }

    lista.innerHTML = tabelasCache
      .map(
        (t) => `
      <div class="admin-game-row align-items-center rounded border p-3">
        <div>
          <strong class="d-block mb-1">${escapeHtml(t.campeonato)}</strong>
          <span class="status-dot ${t.autoAtualizar ? "online" : "offline"}"></span> <span class="small text-muted">${t.autoAtualizar ? "Piloto Automático (On)" : "Manual"}</span>
          <span class="ms-2 small text-muted">• ${t.times ? t.times.length : 0} times</span>
        </div>
        <div class="d-flex gap-2">
          <button type="button" class="btn btn-outline-dark btn-sm" onclick="abrirEditorTimes('${t.id}')">Gerenciar Times</button>
          <button type="button" class="btn btn-outline-secondary btn-sm" onclick="editarTabela('${t.id}')">Editar</button>
          <button type="button" class="btn btn-outline-danger btn-sm" onclick="excluirTabela('${t.id}')" ${t.id === "brasileirao" ? 'disabled title="A tabela principal não pode ser excluída"' : ""}>Excluir</button>
        </div>
      </div>
    `,
      )
      .join("");
  } catch (e) {
    lista.innerHTML = '<div class="empty-box">Erro ao carregar tabelas.</div>';
  }
}

async function salvarTabela(event) {
  event.preventDefault();
  const id = document.getElementById("tabela-id").value;
  const payload = {
    campeonato: document.getElementById("tabela-campeonato").value.trim(),
    autoAtualizar: document.getElementById("tabela-auto").checked,
  };

  try {
    const resposta = await fetch(id ? `/api/tabelas/${id}` : "/api/tabelas", {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resposta.ok) throw new Error();
    mostrarToast("Campeonato salvo com sucesso.");
    limparFormularioTabela();
    carregarTabelasAdmin();
  } catch (e) {
    mostrarToast("Erro ao salvar campeonato.", "danger");
  }
}

window.editarTabela = function (id) {
  const t = tabelasCache.find((x) => String(x.id) === String(id));
  if (!t) return;
  document.getElementById("tabela-id").value = t.id;
  document.getElementById("tabela-campeonato").value = t.campeonato || "";
  document.getElementById("tabela-auto").checked = t.autoAtualizar;

  document.getElementById("titulo-form-tabela").textContent =
    "Editar Campeonato";
  document.getElementById("btn-submit-tabela").textContent =
    "Atualizar Campeonato";
  if (btnCancelarTabela) btnCancelarTabela.classList.remove("d-none");
  window.scrollTo({ top: 0, behavior: "smooth" });
};

window.excluirTabela = async function (id) {
  if (id === "brasileirao") return;
  if (!confirm("Deseja excluir esta tabela?")) return;
  try {
    const resposta = await fetch(`/api/tabelas/${id}`, { method: "DELETE" });
    if (!resposta.ok) throw new Error();
    mostrarToast("Tabela excluída.");
    carregarTabelasAdmin();
  } catch (e) {
    mostrarToast("Erro ao excluir.", "danger");
  }
};

function limparFormularioTabela() {
  if (formTabela) formTabela.reset();
  document.getElementById("tabela-id").value = "";
  document.getElementById("titulo-form-tabela").textContent = "Novo Campeonato";
  document.getElementById("btn-submit-tabela").textContent =
    "Salvar Campeonato";
  if (btnCancelarTabela) btnCancelarTabela.classList.add("d-none");
}

window.abrirEditorTimes = function (id) {
  const t = tabelasCache.find((x) => String(x.id) === String(id));
  if (!t) return;

  document.getElementById("edit-tabela-id").value = t.id;
  document.getElementById("modalEditarTabelaTitle").textContent =
    `Editar Times: ${t.campeonato}`;

  const tbody = document.getElementById("tbody-editar-tabela");
  tbody.innerHTML = "";

  const times = t.times || [];
  if (times.length === 0) {
    adicionarLinhaTabela();
  } else {
    times.forEach((time) => adicionarLinhaTabela(time));
  }

  const modal = new bootstrap.Modal(
    document.getElementById("modalEditarTabela"),
  );
  modal.show();
};

window.adicionarLinhaTabela = function (time = {}) {
  const tbody = document.getElementById("tbody-editar-tabela");
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input type="number" class="form-control form-control-sm text-center t-pos" value="${escapeAttr(time.posicao || "")}"></td>
    <td><input type="text" class="form-control form-control-sm t-nome" value="${escapeAttr(time.nome || "")}" placeholder="Nome do Clube"></td>
    <td><input type="number" class="form-control form-control-sm text-center t-pts" value="${escapeAttr(time.pts || "")}"></td>
    <td><input type="number" class="form-control form-control-sm text-center t-j" value="${escapeAttr(time.j || "")}"></td>
    <td><input type="number" class="form-control form-control-sm text-center t-v" value="${escapeAttr(time.v || "")}"></td>
    <td><input type="number" class="form-control form-control-sm text-center t-e" value="${escapeAttr(time.e || "")}"></td>
    <td><input type="number" class="form-control form-control-sm text-center t-d" value="${escapeAttr(time.d || "")}"></td>
    <td><input type="number" class="form-control form-control-sm text-center t-sg" value="${escapeAttr(time.sg || "")}"></td>
    <td class="text-center"><button type="button" class="btn btn-outline-danger btn-sm p-1" onclick="this.closest('tr').remove()" title="Remover"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"></path></svg></button></td>
  `;
  tbody.appendChild(tr);
};

window.salvarTimesTabela = async function () {
  const id = document.getElementById("edit-tabela-id").value;
  const tbody = document.getElementById("tbody-editar-tabela");
  const rows = tbody.querySelectorAll("tr");

  const times = [];
  rows.forEach((row) => {
    const nome = row.querySelector(".t-nome").value.trim();
    if (!nome) return;
    times.push({
      posicao: row.querySelector(".t-pos").value || "0",
      nome: nome,
      pts: row.querySelector(".t-pts").value || "0",
      j: row.querySelector(".t-j").value || "0",
      v: row.querySelector(".t-v").value || "0",
      e: row.querySelector(".t-e").value || "0",
      d: row.querySelector(".t-d").value || "0",
      sg: row.querySelector(".t-sg").value || "0",
    });
  });

  try {
    const resposta = await fetch(`/api/tabelas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ times }),
    });
    if (!resposta.ok) throw new Error();
    mostrarToast("Times atualizados com sucesso.");

    const modal = bootstrap.Modal.getInstance(
      document.getElementById("modalEditarTabela"),
    );
    if (modal) modal.hide();

    carregarTabelasAdmin();
  } catch (e) {
    mostrarToast("Erro ao salvar times.", "danger");
  }
};

// ==========================================
// ROBÔ IA - CONTROLE MANUAL
// ==========================================
window.rodarRoboManualmente = async function (btn) {
  if (
    !confirm(
      "Deseja forçar a varredura do YouTube agora? Isso consumirá cota da sua API.",
    )
  )
    return;

  const textoOriginal = btn.innerHTML;
  btn.innerHTML =
    '<span class="spinner-border spinner-border-sm"></span> Buscando...';
  btn.disabled = true;

  try {
    const resposta = await fetch("/api/robo/run", { method: "POST" });
    if (!resposta.ok) throw new Error();
    mostrarToast(
      "Robô ativado! Aguarde 1 minuto e atualize a página para ver se há notícias novas.",
      "success",
    );
  } catch (e) {
    mostrarToast("Erro ao tentar acionar o robô.", "danger");
  } finally {
    setTimeout(() => {
      btn.innerHTML = textoOriginal;
      btn.disabled = false;
    }, 3000);
  }
};

// ==========================================
// ADMIN DO TWITTER / X
// ==========================================
let twitterCache = [];
async function carregarTwitterAdmin() {
  const lista = document.getElementById("lista-twitter-admin");
  if (!lista) return;
  lista.innerHTML = '<div class="loading-box">Carregando perfis...</div>';
  try {
    const resposta = await fetch("/api/twitter-gerenciador");
    twitterCache = await resposta.json();
    const countEl = document.getElementById("twitter-count");
    if (countEl) countEl.textContent = `${twitterCache.length} item(ns)`;
    if (!twitterCache.length) {
      lista.innerHTML =
        '<div class="empty-box">Nenhum perfil cadastrado.</div>';
      return;
    }
    lista.innerHTML = twitterCache
      .map(
        (c) => `
      <div class="admin-game-row align-items-center">
        <div class="d-flex align-items-center gap-3">
          ${c.avatarUrl ? `<img src="${escapeHtml(c.avatarUrl)}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 50%;">` : `<div style="width:40px; height:40px; border-radius:50%; background:#ccc;"></div>`}
          <div>
            <strong>${escapeHtml(c.nome)}</strong>
            <span class="d-flex align-items-center gap-2 mt-1"><span class="status-dot ${c.ativo === false ? "offline" : "online"}"></span> ${escapeHtml(c.handle)}</span>
          </div>
        </div>
        <div class="d-flex gap-2">
          <button type="button" class="btn btn-outline-secondary btn-sm" onclick="editarTwitter('${c.id}')">Editar</button>
          <button type="button" class="btn btn-outline-danger btn-sm" onclick="excluirTwitter('${c.id}')">Excluir</button>
        </div>
      </div>
    `,
      )
      .join("");
  } catch {
    lista.innerHTML = '<div class="empty-box">Erro ao carregar perfis.</div>';
  }
}
async function salvarTwitter(event) {
  event.preventDefault();
  const id = document.getElementById("twitter-id").value;
  const payload = {
    nome: document.getElementById("twitter-nome").value.trim(),
    handle: document.getElementById("twitter-handle").value.trim(),
    avatarUrl: document.getElementById("twitter-avatar").value.trim(),
    ativo: document.getElementById("twitter-ativo").checked,
  };
  const resposta = await fetch(
    id ? `/api/twitter-gerenciador/${id}` : "/api/twitter-gerenciador",
    {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!resposta.ok) return mostrarToast("Erro ao salvar.", "danger");
  limparFormularioTwitter();
  mostrarToast("Perfil salvo.");
  carregarTwitterAdmin();
}
window.editarTwitter = function (id) {
  const c = twitterCache.find((x) => String(x.id) === String(id));
  if (!c) return;
  document.getElementById("twitter-id").value = c.id;
  document.getElementById("twitter-nome").value = c.nome || "";
  document.getElementById("twitter-handle").value = c.handle || "";
  document.getElementById("twitter-avatar").value = c.avatarUrl || "";
  document.getElementById("twitter-ativo").checked = c.ativo !== false;
  document.getElementById("titulo-form-twitter").textContent = "Editar Perfil";
  document.getElementById("btn-submit-twitter").textContent =
    "Atualizar perfil";
  document.getElementById("btn-cancelar-twitter").classList.remove("d-none");
  window.scrollTo({ top: 0, behavior: "smooth" });
};
window.excluirTwitter = async function (id) {
  if (!confirm("Deseja excluir este perfil?")) return;
  const resposta = await fetch(`/api/twitter-gerenciador/${id}`, {
    method: "DELETE",
  });
  if (resposta.ok) {
    mostrarToast("Perfil excluído.");
    carregarTwitterAdmin();
  }
};
function limparFormularioTwitter() {
  document.getElementById("form-twitter")?.reset();
  document.getElementById("twitter-id").value = "";
  document.getElementById("twitter-ativo").checked = true;
  document.getElementById("titulo-form-twitter").textContent = "Novo Perfil";
  document.getElementById("btn-submit-twitter").textContent = "Salvar perfil";
  document.getElementById("btn-cancelar-twitter").classList.add("d-none");
}

// ==========================================
// LIMPAR TODOS OS RASCUNHOS
// ==========================================
window.limparTodosRascunhos = async function (btn) {
  const rascunhos = noticiasCache.filter((n) => n.status === "rascunho");
  if (rascunhos.length === 0) {
    return mostrarToast("Não há nenhum rascunho para apagar.", "danger");
  }

  if (
    !confirm(
      `Tem certeza que deseja excluir permanentemente ${rascunhos.length} rascunho(s)? Esta ação não pode ser desfeita.`,
    )
  )
    return;

  const textoOriginal = btn.innerHTML;
  btn.innerHTML =
    '<span class="spinner-border spinner-border-sm"></span> Limpando...';
  btn.disabled = true;

  try {
    const resposta = await fetch("/api/noticias/rascunhos/limpar", {
      method: "DELETE",
    });
    if (!resposta.ok) throw new Error();
    const dados = await resposta.json();
    mostrarToast(dados.mensagem, "success");
    await carregarListaAdmin();
  } catch (e) {
    mostrarToast("Erro ao limpar rascunhos.", "danger");
  } finally {
    btn.innerHTML = textoOriginal;
    btn.disabled = false;
  }
};

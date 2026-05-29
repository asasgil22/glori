const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const multer = require("multer");
const compression = require("compression");
const puppeteer = require("puppeteer");
const session = require("express-session");
const seo = require("./lib/seo");
require("dotenv").config();

// Importações dos Módulos Extraídos (Etapa 1)
const { supabase, lerJSON, salvarJSON } = require("./src/config/database");
const {
  estaLogado,
  exigirLoginPagina,
  exigirLoginAPI,
  exigirPermissaoAdmin,
  exigirSuperAdminAPI,
} = require("./src/middlewares/auth");

const {
  atualizarCacheTwitter,
  getCacheTwitter,
} = require("./src/services/twitterService");
const {
  fetchLatestVideos,
  getVideoCache,
  setVideoCache,
  getLastFetchTime,
  setLastFetchTime,
  resetarCacheYouTube,
  CACHE_DURATION,
} = require("./src/services/youtubeService");
const {
  atualizarCacheDeNoticiasRSS,
  getCacheRSS,
  isRssPronto,
  formatarConteudoHtml,
} = require("./src/services/rssService");
const {
  obterEscudo,
  atualizarTabelaBrasileirao,
  atualizarCacheOdds,
  atualizarAgendaAutomatica,
  getCacheTabela,
  isTabelaPronta,
  setCacheTabela,
  getCacheOdds,
} = require("./src/services/sportsService");

// Importação do Robô Jornalista de IA (Thiago Franklin)
let roboIA;
try {
  roboIA = require("./robo-tf");
} catch (e) {
  console.error("⚠️ Aviso: Erro ao carregar robo-tf.js:", e.message);
}

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.resolve(__dirname, "data");
const PUBLIC_DIR = path.resolve(__dirname, "public");
const UPLOADS_DIR = path.resolve(PUBLIC_DIR, "uploads");
const PATH_NOTICIAS = path.join(DATA_DIR, "noticias.json");
const PATH_ENQUETE = path.join(DATA_DIR, "enquete.json");
const PATH_JOGOS = path.join(DATA_DIR, "jogos.json");
const PATH_CONFIG = path.join(DATA_DIR, "config.json");
const PATH_PATROCINADORES = path.join(DATA_DIR, "patrocinadores.json");
const PATH_VIDEOS = path.join(DATA_DIR, "videos.json");
const PATH_TABELAS = path.join(DATA_DIR, "tabelas.json");
const PATH_AUTORES = path.join(DATA_DIR, "autores.json");
const PATH_TWITTER = path.join(DATA_DIR, "twitter.json");
const PATH_USUARIOS = path.join(DATA_DIR, "usuarios.json");
const PATH_ESCUDOS = path.join(PUBLIC_DIR, "escudos");

app.set("trust proxy", 1);
app.use(compression()); // 🚀 Comprime todas as respostas HTTP deixando o site até 70% mais rápido!
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "portal-noticias-chave-secreta-2026",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 2 * 60 * 60 * 1000,
    },
  }),
);

// ==========================================
// 🧠 MEMÓRIA CACHE (YouTube Videos)
// ==========================================

async function garantirEstrutura() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await garantirArquivo(PATH_NOTICIAS, []);
  await garantirArquivo(PATH_ENQUETE, {
    pergunta: "Qual tema voce quer ver mais no portal?",
    opcoes: {
      Esportes: 4,
      Politica: 2,
      Tecnologia: 5,
      Cultura: 1,
    },
  });
  await garantirArquivo(PATH_JOGOS, [
    {
      id: "1",
      campeonato: "Campeonato Brasileiro",
      dataHora: "2026-05-24T16:00",
      mandante: "BOT",
      visitante: "SAO",
      placarMandante: null,
      placarVisitante: null,
    },
  ]);
  await garantirArquivo(PATH_TABELAS, [
    {
      id: "brasileirao",
      campeonato: "Brasileirão Série A",
      autoAtualizar: true,
      times: [],
    },
  ]);
  await garantirArquivo(
    PATH_PATROCINADORES,
    ["TechCorp", "SportsBet", "MegaStore", "AutoPeças", "FastFood"].map(
      (nome, i) => ({
        id: String(Date.now() + i),
        nome,
        tipo: "texto",
        imagemUrl: "",
        link: "",
        ativo: true,
      }),
    ),
  );
  await garantirArquivo(PATH_USUARIOS, [
    {
      id: "super_admin_id",
      usuario: "Admin",
      senha: "Sog+123+#",
      role: "super_admin",
    },
    {
      id: "admin_id",
      usuario: "Sergio",
      senha: "asas18",
      role: "admin",
    },
    {
      id: "usuario_id",
      usuario: "dep",
      senha: "dep",
      role: "usuario",
    },
  ]);
  await garantirArquivo(PATH_AUTORES, []);
  await garantirArquivo(PATH_TWITTER, [
    {
      id: "1",
      nome: "Botafogo F.R.",
      handle: "@Botafogo",
      avatarUrl:
        "https://pbs.twimg.com/profile_images/1792610731773403136/O1V8vR5M_400x400.jpg",
      ativo: true,
    },
  ]);
  await garantirArquivo(PATH_VIDEOS, []);
  await garantirArquivo(PATH_CONFIG, {
    nomePortal: "Portal Noticias",
    slogan: "Informacao clara, direta e em tempo real",
    corPrincipal: "#262626",
    corAcento: "#0f766e",
    logoUrl: "",
    logoEfeito: "shake",
    logoTremor: 4,
    bannerMarcaUrl: "",
    modoMarca: "texto",
    alturaBannerMarca: 52,
    mostrarTextoMarca: true,
    fundoHeaderTipo: "cor",
    fundoHeaderCor: "",
    fundoHeaderImagemUrl: "",
    fundoHeaderOverlay: 35,
    fundoSiteTipo: "padrao",
    fundoSiteCor: "#f7f8fa",
    fundoSiteImagemUrl: "",
    fundoSiteOverlay: 0,
    imagemPadraoUrl: "",
    buscaTitulo: "Explore o portal",
    buscaSubtitulo: "busque por titulo, assunto ou categoria",
    buscaImagemUrl: "",
    buscaImagemAltura: 50,
    buscaLargura: 640,
    buscaCorFundo: "#ffffff",
    buscaPaddingVertical: 31,
    buscaTextoBotao: "Buscar",
    buscaCorTextoBotao: "#ffffff",
    home: {
      mostrarBusca: true,
      mostrarCarrossel: true,
      mostrarUltimas: true,
      mostrarMaisLidas: true,
      mostrarJogos: true,
      mostrarEnquete: true,
      mostrarPortais: true,
      limiteNoticias: 6,
      limiteRss: 4,
      limiteJogos: 3,
      limiteCarrossel: 5,
      temaCarrossel: "claro",
      modeloCarrossel: "editorial",
      alturaCarrossel: "medio",
      autoplayCarrossel: 6,
      mostrarResumoCarrossel: true,
      mostrarMiniaturasCarrossel: true,
      mostrarContadorCarrossel: true,
      mostrarSetasCarrossel: true,
      mostrarDotsCarrossel: true,
      efeitoCamaleao: false,
      widgets: {
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
        portais: {
          titulo: "Últimas dos Portais",
          subtitulo: "Notícias de outras fontes",
          icone: "lista",
          layout: "lista",
        },
      },
      mostrarPatrocinadores: true,
      patrocinadoresTitulo: "",
      patrocinadoresAltura: 40,
      carrosselIds: [],
    },
  });
}

async function garantirArquivo(caminho, valorPadrao) {
  const chave = path.basename(caminho, ".json");
  let dadosLocais = null;

  try {
    const conteudoLocal = await fs.readFile(caminho, "utf8");
    if (conteudoLocal.trim()) dadosLocais = JSON.parse(conteudoLocal);
  } catch (e) {}

  if (supabase) {
    const { data } = await supabase
      .from("json_store")
      .select("id")
      .eq("id", chave)
      .single();
    if (!data) {
      // Se a nuvem estiver vazia, sobe os dados locais (Upload). Se não tiver local, usa o padrão.
      await salvarJSON(caminho, dadosLocais || valorPadrao);
    }
  }
}

function normalizarBoolean(valor) {
  return valor === true || valor === "true" || valor === "on" || valor === "1";
}

async function uploadParaSupabase(file) {
  if (!supabase) {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const filepath = path.join(UPLOADS_DIR, filename);
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    await fs.writeFile(filepath, file.buffer);
    return `/uploads/${filename}`;
  }

  const ext = path.extname(file.originalname || "").toLowerCase();
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

  const { data, error } = await supabase.storage
    .from("uploads")
    .upload(filename, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (error) {
    console.error("Erro no upload para Supabase:", error.message);
    throw new Error("Falha ao enviar imagem para a nuvem.");
  }

  const { data: publicUrlData } = supabase.storage
    .from("uploads")
    .getPublicUrl(filename);

  return publicUrlData.publicUrl;
}

async function resolverImagemNoticia(req, imagemAtual = "") {
  if (req.file) return await uploadParaSupabase(req.file);
  const urlExterna = String(req.body.imagemUrl || "").trim();
  if (urlExterna) return urlExterna;
  return imagemAtual;
}

function lerBooleanConfig(valor, padrao = true) {
  if (valor === undefined || valor === null || valor === "") return padrao;
  return normalizarBoolean(valor);
}

function slugify(texto) {
  return (
    String(texto || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || Date.now().toString()
  );
}

function garantirSlugUnico(noticias, titulo, idAtual) {
  const base = slugify(titulo);
  let slug = base;
  let contador = 2;
  while (
    noticias.some(
      (item) => item.slug === slug && String(item.id) !== String(idAtual),
    )
  ) {
    slug = `${base}-${contador}`;
    contador += 1;
  }
  return slug;
}

function normalizarNoticia(noticia, noticias = []) {
  const titulo = noticia.titulo || "Sem titulo";
  const tags = Array.isArray(noticia.tags)
    ? noticia.tags
    : String(noticia.tags || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

  return {
    ...noticia,
    titulo,
    resumo: noticia.resumo || "",
    conteudo: noticia.conteudo || noticia.resumo || "",
    categoria: noticia.categoria || "Geral",
    autor: noticia.autor || "Redacao",
    tags,
    slug: noticia.slug || garantirSlugUnico(noticias, titulo, noticia.id),
    status: noticia.status === "rascunho" ? "rascunho" : "publicado",
  };
}

function noticiaPublicavel(noticia) {
  return noticia.status !== "rascunho";
}

const MODELOS_CARROSSEL_VALIDOS = new Set([
  "editorial",
  "fullscreen",
  "compacto",
  "split",
  "filmstrip",
  "magazine",
  "card",
  "bottom",
  "gradient",
]);
const EFEITOS_LOGO_VALIDOS = new Set([
  "shake",
  "pulse",
  "bounce",
  "spin",
  "none",
]);
const ALTURAS_CARROSSEL_VALIDAS = new Set(["baixo", "medio", "alto", "extra"]);
const MODOS_MARCA_VALIDOS = new Set([
  "texto",
  "icone",
  "banner",
  "icone_banner",
]);
const FUNDOS_TIPO_VALIDOS = new Set(["cor", "imagem"]);
const FUNDOS_SITE_TIPO_VALIDOS = new Set(["padrao", "cor", "imagem"]);
const ICONES_WIDGET_VALIDOS = new Set([
  "sem",
  "grafico",
  "fogo",
  "estrela",
  "bola",
  "trofeu",
  "enquete",
  "megafone",
  "raio",
  "relogio",
  "lista",
  "play",
  "twitter",
]);
const LAYOUTS_WIDGET_VALIDOS = {
  maisLidas: new Set(["lista", "compacto", "cards"]),
  jogos: new Set(["cards", "linha", "tabela"]),
  enquete: new Set(["barras", "classic", "minimal"]),
  tabela: new Set(["completo", "resumido"]),
  odds: new Set(["cards", "lista"]),
  portais: new Set(["lista"]),
  videos: new Set(["carrossel", "lista"]),
  twitter: new Set(["cards", "lista", "carrossel"]),
};

const CASAS_APOSTAS_PADRAO = [
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

function normalizarWidgets(home = {}) {
  const padroes = {
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
    portais: {
      titulo: "Últimas dos Portais",
      subtitulo: "Notícias de outras fontes",
      icone: "lista",
      layout: "lista",
    },
    videos: {
      titulo: "Últimos Vídeos",
      subtitulo: "Acompanhe nosso canal",
      icone: "play",
      layout: "carrossel",
    },
    twitter: {
      titulo: "Comunidade Alvinegra",
      subtitulo: "O que estão falando no X",
      icone: "twitter",
      layout: "cards",
      tempoExibicao: 5,
      tipoTransicao: "slide",
      velocidadeTransicao: 500,
      quantidadePorConta: 3,
      mostrarMidia: true,
    },
  };
  const entrada = home.widgets || {};
  const widgets = {};

  Object.entries(padroes).forEach(([chave, padrao]) => {
    const atual = entrada[chave] || {};
    widgets[chave] = {
      titulo: String(atual.titulo || padrao.titulo).slice(0, 80),
      subtitulo: String(atual.subtitulo || padrao.subtitulo).slice(0, 120),
      icone: ICONES_WIDGET_VALIDOS.has(atual.icone)
        ? atual.icone
        : padrao.icone,
      layout: LAYOUTS_WIDGET_VALIDOS[chave]?.has(atual.layout)
        ? atual.layout
        : padrao.layout,
    };
  });

  if (widgets["twitter"]) {
    const atualTw = entrada["twitter"] || {};
    widgets["twitter"].tempoExibicao =
      atualTw.tempoExibicao !== undefined
        ? Number(atualTw.tempoExibicao)
        : padroes.twitter.tempoExibicao;
    widgets["twitter"].tipoTransicao =
      atualTw.tipoTransicao || padroes.twitter.tipoTransicao;
    widgets["twitter"].velocidadeTransicao =
      atualTw.velocidadeTransicao !== undefined
        ? Number(atualTw.velocidadeTransicao)
        : padroes.twitter.velocidadeTransicao;
    widgets["twitter"].quantidadePorConta =
      atualTw.quantidadePorConta !== undefined
        ? Number(atualTw.quantidadePorConta)
        : padroes.twitter.quantidadePorConta;
    widgets["twitter"].mostrarMidia =
      atualTw.mostrarMidia !== undefined
        ? atualTw.mostrarMidia
        : padroes.twitter.mostrarMidia;
  }

  return widgets;
}

function normalizarConfig(config = {}) {
  const modeloCarrossel = MODELOS_CARROSSEL_VALIDOS.has(
    config.home?.modeloCarrossel,
  )
    ? config.home.modeloCarrossel
    : "editorial";
  const alturaCarrossel = ALTURAS_CARROSSEL_VALIDAS.has(
    config.home?.alturaCarrossel,
  )
    ? config.home.alturaCarrossel
    : "medio";
  const modoMarca = MODOS_MARCA_VALIDOS.has(config.modoMarca)
    ? config.modoMarca
    : "texto";

  const padraoOrdem = [
    "maisLidas",
    "jogos",
    "enquete",
    "tabela",
    "odds",
    "videos",
    "twitter",
    "portais",
  ];
  let ordemWidgets = Array.isArray(config.home?.ordemWidgets)
    ? config.home.ordemWidgets
    : padraoOrdem;

  // Auto-recuperação: Adiciona widgets novos no final da lista se estiverem faltando no arquivo JSON salvo
  ordemWidgets = [...new Set([...ordemWidgets, ...padraoOrdem])].filter((w) =>
    padraoOrdem.includes(w),
  );

  return {
    nomePortal: config.nomePortal || "Portal Noticias",
    slogan: config.slogan || "Informacao clara, direta e em tempo real",
    corPrincipal: config.corPrincipal || "#262626",
    corAcento: config.corAcento || "#0f766e",
    logoUrl: config.logoUrl || "",
    logoTremor: config.logoTremor !== undefined ? Number(config.logoTremor) : 4,
    logoEfeito: EFEITOS_LOGO_VALIDOS.has(config.logoEfeito)
      ? config.logoEfeito
      : "shake",
    faviconUrl: config.faviconUrl || "",
    bannerMarcaUrl: config.bannerMarcaUrl || "",
    modoMarca,
    alturaBannerMarca: Math.min(
      Math.max(Number(config.alturaBannerMarca) || 52, 28),
      120,
    ),
    mostrarTextoMarca: config.mostrarTextoMarca !== false,
    fundoHeaderTipo: FUNDOS_TIPO_VALIDOS.has(config.fundoHeaderTipo)
      ? config.fundoHeaderTipo
      : "cor",
    fundoHeaderCor: config.fundoHeaderCor || "",
    fundoHeaderImagemUrl: config.fundoHeaderImagemUrl || "",
    fundoHeaderOverlay: Math.min(
      Math.max(Number(config.fundoHeaderOverlay) || 35, 0),
      85,
    ),
    fundoSiteTipo: FUNDOS_SITE_TIPO_VALIDOS.has(config.fundoSiteTipo)
      ? config.fundoSiteTipo
      : "padrao",
    fundoSiteCor: config.fundoSiteCor || "#f7f8fa",
    fundoSiteImagemUrl: config.fundoSiteImagemUrl || "",
    fundoSiteOverlay: Math.min(
      Math.max(Number(config.fundoSiteOverlay) || 0, 0),
      85,
    ),
    imagemPadraoUrl: config.imagemPadraoUrl || "",
    buscaTitulo: config.buscaTitulo || "Explore o portal",
    buscaSubtitulo:
      config.buscaSubtitulo || "busque por titulo, assunto ou categoria",
    buscaImagemUrl: config.buscaImagemUrl || "",
    buscaImagemAltura: Math.min(
      Math.max(Number(config.buscaImagemAltura) || 50, 20),
      200,
    ),
    buscaLargura: Math.min(
      Math.max(Number(config.buscaLargura) || 640, 200),
      1200,
    ),
    buscaPlaceholder:
      config.buscaPlaceholder || "Pesquisar notícias, categorias ou autores...",
    buscaCorFundo: config.buscaCorFundo || "#ffffff",
    buscaPaddingVertical: Math.min(
      Math.max(Number(config.buscaPaddingVertical) || 31, 10),
      150,
    ),
    buscaTextoBotao: config.buscaTextoBotao || "Buscar",
    buscaCorTextoBotao: config.buscaCorTextoBotao || "#ffffff",
    siteUrl: config.siteUrl || "",
    seoDescricao: config.seoDescricao || "",
    youtubeChannelId: config.youtubeChannelId || "",
    home: {
      mostrarTicker: config.home?.mostrarTicker !== false,
      mostrarBusca: config.home?.mostrarBusca !== false,
      mostrarCarrossel: config.home?.mostrarCarrossel !== false,
      mostrarUltimas: config.home?.mostrarUltimas !== false,
      mostrarMaisLidas: config.home?.mostrarMaisLidas !== false,
      mostrarJogos: config.home?.mostrarJogos !== false,
      mostrarEnquete: config.home?.mostrarEnquete !== false,
      mostrarTabela: config.home?.mostrarTabela !== false,
      mostrarOdds: config.home?.mostrarOdds !== false,
      mostrarVideos: config.home?.mostrarVideos !== false,
      mostrarTwitter: config.home?.mostrarTwitter !== false,
      mostrarPortais: config.home?.mostrarPortais !== false,
      carrosselAutoRss: config.home?.carrosselAutoRss === true,
      limiteNoticias: Math.min(
        Math.max(Number(config.home?.limiteNoticias) || 6, 1),
        100,
      ),
      limiteRss: Math.min(
        Math.max(Number(config.home?.limiteRss) || 15, 1),
        100,
      ),
      limiteJogos: Math.max(Number(config.home?.limiteJogos) || 3, 1),
      limiteCarrossel: Math.min(
        Math.max(Number(config.home?.limiteCarrossel) || 5, 1),
        20,
      ),
      limiteVideos: Math.min(
        Math.max(Number(config.home?.limiteVideos) || 3, 1),
        10,
      ),
      modoVideos: config.home?.modoVideos === "manual" ? "manual" : "auto",
      textoBotaoVideo:
        config.home?.textoBotaoVideo !== undefined
          ? config.home.textoBotaoVideo
          : "Clique na imagem para assistir",
      videosCorBotao: config.home?.videosCorBotao || "#dc3545",
      videosIntervalo:
        config.home?.videosIntervalo !== undefined
          ? Math.min(Math.max(Number(config.home?.videosIntervalo), 0), 60)
          : 5,
      videosProporcao: config.home?.videosProporcao || "16/9",
      temaCarrossel:
        config.home?.temaCarrossel === "escuro" ? "escuro" : "claro",
      modeloCarrossel,
      alturaCarrossel,
      autoplayCarrossel: Math.min(
        Math.max(Number(config.home?.autoplayCarrossel) || 6, 3),
        20,
      ),
      mostrarResumoCarrossel: config.home?.mostrarResumoCarrossel !== false,
      mostrarMiniaturasCarrossel:
        config.home?.mostrarMiniaturasCarrossel !== false,
      mostrarContadorCarrossel: config.home?.mostrarContadorCarrossel !== false,
      mostrarSetasCarrossel: config.home?.mostrarSetasCarrossel !== false,
      mostrarDotsCarrossel: config.home?.mostrarDotsCarrossel !== false,
      efeitoCamaleao: config.home?.efeitoCamaleao === true,
      widgets: normalizarWidgets(config.home),
      ordemWidgets,
      carrosselIds: Array.isArray(config.home?.carrosselIds)
        ? config.home.carrosselIds.map(String).filter(Boolean)
        : [],
      portaisPermitidos: Array.isArray(config.home?.portaisPermitidos)
        ? config.home.portaisPermitidos
        : TODOS_PORTAIS,
      casasDeApostasPermitidas: Array.isArray(
        config.home?.casasDeApostasPermitidas,
      )
        ? config.home.casasDeApostasPermitidas
        : CASAS_APOSTAS_PADRAO,
      casaDeApostaDestaque: config.home?.casaDeApostaDestaque || "VBET",
      rssCustom: config.home?.rssCustom || {},
      mostrarPatrocinadores: config.home?.mostrarPatrocinadores !== false,
      patrocinadoresTitulo: config.home?.patrocinadoresTitulo || "",
      patrocinadoresAltura: Math.min(
        Math.max(Number(config.home?.patrocinadoresAltura) || 40, 20),
        100,
      ),
      patrocinadoresCorFundo: config.home?.patrocinadoresCorFundo || "#f8f9fa",
      patrocinadoresCorTexto: config.home?.patrocinadoresCorTexto || "#6c757d",
      patrocinadoresVelocidade: Math.min(
        Math.max(Number(config.home?.patrocinadoresVelocidade) || 25, 5),
        100,
      ),
      tamanhoFotoAutor: Math.min(
        Math.max(Number(config.home?.tamanhoFotoAutor) || 70, 40),
        120,
      ),
    },
    portais: {
      titulo: "Últimas dos Portais",
      subtitulo: "Notícias de outras fontes",
      icone: "lista",
      layout: "lista",
    },
  };
}

function parseCarrosselIds(valor) {
  if (Array.isArray(valor)) return valor.map(String).filter(Boolean);
  try {
    const parsed = JSON.parse(valor || "[]");
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

async function obterDestaquesCarrossel(noticias) {
  const config = normalizarConfig(await lerJSON(PATH_CONFIG, {}));
  const limite = config.home.limiteCarrossel;
  const ids = config.home.carrosselIds;
  let destaques = [];

  if (config.home.carrosselAutoRss) {
    // Pega automaticamente as últimas notícias (já ordenadas por data) que possuem imagem de capa
    let destaquesAuto = noticias.filter(
      (noticia) => noticia.imagemUrl && String(noticia.imagemUrl).trim() !== "",
    );

    // Fallback: se não tiver fotos suficientes na varredura, completa com as últimas notícias gerais para não deixar o carrossel vazio
    if (destaquesAuto.length === 0) destaquesAuto = noticias;

    // Retorna imediatamente, bloqueando e ignorando qualquer seleção manual do painel
    return destaquesAuto.slice(0, limite);
  }

  if (destaques.length < limite && ids.length) {
    const manuais = ids
      .map((id) =>
        noticias.find((noticia) => String(noticia.id) === String(id)),
      )
      .filter(Boolean)
      .filter((n) => !destaques.some((d) => d.id === n.id));
    destaques = [...destaques, ...manuais];
  }

  if (destaques.length < limite) {
    const locais = noticias
      .filter((noticia) => !noticia.isRss && noticia.destaqueCarousel)
      .filter((n) => !destaques.some((d) => d.id === n.id));
    destaques = [...destaques, ...locais];
  }

  return destaques.slice(0, limite);
}

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return cb(new Error("Envie apenas arquivos de imagem."));
    }
    cb(null, true);
  },
});

const htmlTemplates = {};

async function carregarTemplateHtml(arquivo) {
  if (!htmlTemplates[arquivo]) {
    htmlTemplates[arquivo] = await fs.readFile(
      path.join(PUBLIC_DIR, arquivo),
      "utf8",
    );
  }
  return htmlTemplates[arquivo];
}

async function servirHtmlComSeo(res, arquivo, metaHtml) {
  const template = await carregarTemplateHtml(arquivo);
  const config = normalizarConfig(await lerJSON(PATH_CONFIG, {}));
  const tremorVal = config.logoTremor !== undefined ? config.logoTremor : 4;
  const efeito = config.logoEfeito || "shake";
  const animLoad =
    efeito === "none"
      ? "none"
      : `logo${efeito.charAt(0).toUpperCase() + efeito.slice(1)}Load`;
  const animHover =
    efeito === "none"
      ? "none"
      : `logo${efeito.charAt(0).toUpperCase() + efeito.slice(1)}Hover`;
  const tremorStyle = `<style>:root { --logo-shake-px: ${tremorVal}px; --logo-shake-deg: ${tremorVal / 2}deg; --logo-anim-load: ${animLoad}; --logo-anim-hover: ${animHover}; }</style>`;
  const conteudoHead = metaHtml + "\n  " + tremorStyle;
  const html = template.includes("<!-- PORTAL_SEO -->")
    ? template.replace("<!-- PORTAL_SEO -->", conteudoHead)
    : template.replace("</head>", `  ${conteudoHead}\n</head>`);
  res.type("html").send(html);
}

app.use(exigirLoginPagina);

app.get("/robots.txt", async (req, res) => {
  const config = normalizarConfig(await lerJSON(PATH_CONFIG, {}));
  const base = seo.getBaseUrl(req, config);
  res
    .type("text/plain")
    .send(
      `User-agent: *\nAllow: /\nDisallow: /admin.html\nDisallow: /login.html\nDisallow: /api/\n\nSitemap: ${seo.urlAbsoluta(base, "/sitemap.xml")}\n`,
    );
});

app.get("/sitemap.xml", async (req, res) => {
  const config = normalizarConfig(await lerJSON(PATH_CONFIG, {}));
  const base = seo.getBaseUrl(req, config);
  const noticias = (await lerJSON(PATH_NOTICIAS, []))
    .map((item) => normalizarNoticia(item))
    .filter(noticiaPublicavel)
    .sort(
      (a, b) =>
        new Date(b.data || 0).getTime() - new Date(a.data || 0).getTime(),
    );
  const categorias = [
    ...new Set(noticias.map((item) => item.categoria || "Geral")),
  ];

  const entradas = [
    { loc: seo.urlAbsoluta(base, "/"), changefreq: "hourly", priority: "1.0" },
    ...categorias.map((nome) => ({
      loc: seo.urlAbsoluta(base, `/categoria/${seo.slugifyCategoria(nome)}`),
      changefreq: "daily",
      priority: "0.7",
    })),
    ...noticias.map((item) => ({
      loc: seo.urlAbsoluta(
        base,
        `/noticia/${encodeURIComponent(item.slug || item.id)}`,
      ),
      lastmod: item.data,
      changefreq: "weekly",
      priority: "0.8",
    })),
  ];

  const corpo = entradas
    .map((entrada) => {
      const lastmod = entrada.lastmod
        ? `<lastmod>${new Date(entrada.lastmod).toISOString().slice(0, 10)}</lastmod>`
        : "";
      return `  <url>\n    <loc>${seo.escapeHtml(entrada.loc)}</loc>\n    ${lastmod}\n    <changefreq>${entrada.changefreq}</changefreq>\n    <priority>${entrada.priority}</priority>\n  </url>`;
    })
    .join("\n");

  res
    .type("application/xml")
    .send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${corpo}\n</urlset>`,
    );
});

app.get("/noticia.html", (req, res) => {
  const slug = req.query.slug || req.query.id;
  if (slug) {
    return res.redirect(301, `/noticia/${encodeURIComponent(slug)}`);
  }
  res.redirect(302, "/");
});

app.get("/noticia/:slug", async (req, res) => {
  const config = normalizarConfig(await lerJSON(PATH_CONFIG, {}));
  const base = seo.getBaseUrl(req, config);
  const noticias = (await lerJSON(PATH_NOTICIAS, [])).map((item) =>
    normalizarNoticia(item),
  );
  let noticia = noticias.find(
    (item) =>
      String(item.slug) === String(req.params.slug) ||
      String(item.id) === String(req.params.slug),
  );

  if (!noticia && isRssPronto()) {
    const nRss = getCacheRSS().find((n) => {
      const hashId = Buffer.from(n.link || "")
        .toString("base64")
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(-25);
      const id = `rss-${hashId}`;
      return id === req.params.slug;
    });
    if (nRss && nRss.portal === "FOGÃONET") {
      const id = req.params.slug;
      const custom = config.home.rssCustom?.[id] || {};
      noticia = {
        id: id,
        slug: id,
        titulo: custom.titulo || nRss.titulo,
        resumo: custom.resumo || nRss.resumo,
        conteudo:
          custom.conteudo || nRss.conteudo || custom.resumo || nRss.resumo,
        categoria: nRss.portal,
        autor: nRss.portal,
        tags: [],
        status: "publicado",
        data: nRss.data,
        imagemUrl:
          custom.imagemUrl !== undefined ? custom.imagemUrl : nRss.imagem,
        isRss: true,
        portal: nRss.portal,
        linkExterno: nRss.linkResolvido || nRss.link,
      };
    }
  }

  if (
    !noticia ||
    (!noticiaPublicavel(noticia) && !noticia.isRss && !estaLogado(req))
  ) {
    const meta = seo.buildMetaTags({
      title: `Noticia nao encontrada | ${config.nomePortal}`,
      description: "A materia solicitada nao esta disponivel.",
      canonical: seo.urlAbsoluta(
        base,
        `/noticia/${encodeURIComponent(req.params.slug)}`,
      ),
      siteName: config.nomePortal,
      noindex: true,
    });
    res.status(404);
    return servirHtmlComSeo(res, "noticia.html", meta);
  }

  return servirHtmlComSeo(
    res,
    "noticia.html",
    seo.metaNoticia(noticia, config, base),
  );
});

app.get("/categoria/:slug", async (req, res) => {
  const config = normalizarConfig(await lerJSON(PATH_CONFIG, {}));
  const base = seo.getBaseUrl(req, config);
  const noticias = (await lerJSON(PATH_NOTICIAS, []))
    .map((item) => normalizarNoticia(item))
    .filter(noticiaPublicavel);
  const nomeCategoria = seo.encontrarNomeCategoria(noticias, req.params.slug);
  const total = nomeCategoria
    ? noticias.filter((item) => seo.categoriaCombina(item, req.params.slug))
        .length
    : 0;

  if (!nomeCategoria) {
    const meta = seo.buildMetaTags({
      title: `Categoria nao encontrada | ${config.nomePortal}`,
      description: "Nenhuma materia publicada nesta categoria.",
      canonical: seo.urlAbsoluta(
        base,
        `/categoria/${encodeURIComponent(req.params.slug)}`,
      ),
      siteName: config.nomePortal,
      noindex: true,
    });
    res.status(404);
    return servirHtmlComSeo(res, "categoria.html", meta);
  }

  return servirHtmlComSeo(
    res,
    "categoria.html",
    seo.metaCategoria(nomeCategoria, config, base, total),
  );
});

app.use(express.static(PUBLIC_DIR, { index: false }));

app.get("/", async (req, res) => {
  const config = normalizarConfig(await lerJSON(PATH_CONFIG, {}));
  const base = seo.getBaseUrl(req, config);
  return servirHtmlComSeo(res, "index.html", seo.metaHome(config, base));
});

app.use("/api", require("./src/routes/auth"));
app.use("/api/usuarios", require("./src/routes/usuarios"));
app.use("/api", require("./src/routes/painel"));
app.use("/api", require("./src/routes/esportes"));
app.use("/api", require("./src/routes/twitter"));

// Rota leve para o UptimeRobot monitorar e manter o servidor acordado
app.get("/ping", (req, res) => {
  res.status(200).send("pong");
});

app.get("/api/config", async (req, res) => {
  res.json(normalizarConfig(await lerJSON(PATH_CONFIG, {})));
});

async function resolverBannerMarca(req, atual = "") {
  if (req.files?.bannerMarca?.[0])
    return await uploadParaSupabase(req.files.bannerMarca[0]);
  const urlExterna = String(req.body.bannerMarcaUrl || "").trim();
  if (urlExterna) return urlExterna;
  return atual;
}

async function resolverFundoImagem(req, campoArquivo, campoUrl, atual = "") {
  if (req.files?.[campoArquivo]?.[0])
    return await uploadParaSupabase(req.files[campoArquivo][0]);
  const urlExterna = String(req.body[campoUrl] || "").trim();
  if (urlExterna) return urlExterna;
  return atual;
}

app.put(
  "/api/config",
  exigirPermissaoAdmin,
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "bannerMarca", maxCount: 1 },
    { name: "fundoHeader", maxCount: 1 },
    { name: "fundoSite", maxCount: 1 },
    { name: "imagemPadrao", maxCount: 1 },
    { name: "buscaImagem", maxCount: 1 },
    { name: "favicon", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const atual = normalizarConfig(await lerJSON(PATH_CONFIG, {}));
      const modoMarca = MODOS_MARCA_VALIDOS.has(req.body.modoMarca)
        ? req.body.modoMarca
        : atual.modoMarca;
      const config = {
        ...atual,
        nomePortal: req.body.nomePortal || atual.nomePortal,
        slogan: req.body.slogan || "",
        corPrincipal: req.body.corPrincipal || atual.corPrincipal,
        corAcento: req.body.corAcento || atual.corAcento,
        logoUrl: req.files?.logo?.[0]
          ? await uploadParaSupabase(req.files.logo[0])
          : atual.logoUrl,
        logoTremor:
          req.body.logoTremor !== undefined
            ? Number(req.body.logoTremor)
            : atual.logoTremor,
        logoEfeito:
          req.body.logoEfeito !== undefined
            ? req.body.logoEfeito
            : atual.logoEfeito,
        faviconUrl: await resolverFundoImagem(
          req,
          "favicon",
          "faviconUrl",
          atual.faviconUrl,
        ),
        bannerMarcaUrl: await resolverBannerMarca(req, atual.bannerMarcaUrl),
        modoMarca,
        alturaBannerMarca: Math.min(
          Math.max(
            Number(req.body.alturaBannerMarca) || atual.alturaBannerMarca,
            28,
          ),
          120,
        ),
        mostrarTextoMarca: lerBooleanConfig(
          req.body.mostrarTextoMarca,
          atual.mostrarTextoMarca,
        ),
        fundoHeaderTipo: FUNDOS_TIPO_VALIDOS.has(req.body.fundoHeaderTipo)
          ? req.body.fundoHeaderTipo
          : atual.fundoHeaderTipo,
        fundoHeaderCor: req.body.fundoHeaderCor || "",
        fundoHeaderImagemUrl: await resolverFundoImagem(
          req,
          "fundoHeader",
          "fundoHeaderUrl",
          atual.fundoHeaderImagemUrl,
        ),
        fundoHeaderOverlay: Math.min(
          Math.max(
            Number(req.body.fundoHeaderOverlay) || atual.fundoHeaderOverlay,
            0,
          ),
          85,
        ),
        fundoSiteTipo: FUNDOS_SITE_TIPO_VALIDOS.has(req.body.fundoSiteTipo)
          ? req.body.fundoSiteTipo
          : atual.fundoSiteTipo,
        fundoSiteCor: req.body.fundoSiteCor || atual.fundoSiteCor,
        fundoSiteImagemUrl: await resolverFundoImagem(
          req,
          "fundoSite",
          "fundoSiteUrl",
          atual.fundoSiteImagemUrl,
        ),
        fundoSiteOverlay: Math.min(
          Math.max(
            Number(req.body.fundoSiteOverlay) || atual.fundoSiteOverlay,
            0,
          ),
          85,
        ),
        imagemPadraoUrl: req.files?.imagemPadrao?.[0]
          ? await uploadParaSupabase(req.files.imagemPadrao[0])
          : atual.imagemPadraoUrl,
        buscaTitulo:
          req.body.buscaTitulo !== undefined
            ? req.body.buscaTitulo
            : atual.buscaTitulo || "Explore o portal",
        buscaSubtitulo:
          req.body.buscaSubtitulo !== undefined
            ? req.body.buscaSubtitulo
            : atual.buscaSubtitulo || "busque por titulo, assunto ou categoria",
        buscaPlaceholder:
          req.body.buscaPlaceholder !== undefined
            ? req.body.buscaPlaceholder
            : atual.buscaPlaceholder ||
              "Pesquisar notícias, categorias ou autores...",
        buscaImagemUrl: await resolverFundoImagem(
          req,
          "buscaImagem",
          "buscaImagemUrl",
          atual.buscaImagemUrl,
        ),
        buscaImagemAltura: Math.min(
          Math.max(
            Number(req.body.buscaImagemAltura) || atual.buscaImagemAltura,
            20,
          ),
          200,
        ),
        buscaLargura: Math.min(
          Math.max(Number(req.body.buscaLargura) || atual.buscaLargura, 200),
          1200,
        ),
        buscaCorFundo:
          req.body.buscaCorFundo !== undefined
            ? req.body.buscaCorFundo
            : atual.buscaCorFundo || "#ffffff",
        buscaPaddingVertical: Math.min(
          Math.max(
            Number(req.body.buscaPaddingVertical) || atual.buscaPaddingVertical,
            10,
          ),
          150,
        ),
        buscaTextoBotao:
          req.body.buscaTextoBotao !== undefined
            ? req.body.buscaTextoBotao
            : atual.buscaTextoBotao || "Buscar",
        buscaCorTextoBotao:
          req.body.buscaCorTextoBotao !== undefined
            ? req.body.buscaCorTextoBotao
            : atual.buscaCorTextoBotao || "#ffffff",
        youtubeChannelId:
          req.body.youtubeChannelId !== undefined
            ? req.body.youtubeChannelId
            : atual.youtubeChannelId || "",
        home: {
          mostrarBusca: lerBooleanConfig(
            req.body.mostrarBusca,
            atual.home.mostrarBusca,
          ),
          mostrarCarrossel: lerBooleanConfig(
            req.body.mostrarCarrossel,
            atual.home.mostrarCarrossel,
          ),
          mostrarUltimas: lerBooleanConfig(
            req.body.mostrarUltimas,
            atual.home.mostrarUltimas,
          ),
          mostrarMaisLidas: lerBooleanConfig(
            req.body.mostrarMaisLidas,
            atual.home.mostrarMaisLidas,
          ),
          mostrarJogos: lerBooleanConfig(
            req.body.mostrarJogos,
            atual.home.mostrarJogos,
          ),
          mostrarEnquete: lerBooleanConfig(
            req.body.mostrarEnquete,
            atual.home.mostrarEnquete,
          ),
          mostrarTabela: lerBooleanConfig(
            req.body.mostrarTabela,
            atual.home.mostrarTabela,
          ),
          mostrarOdds: lerBooleanConfig(
            req.body.mostrarOdds,
            atual.home.mostrarOdds,
          ),
          mostrarVideos: lerBooleanConfig(
            req.body.mostrarVideos,
            atual.home.mostrarVideos,
          ),
          mostrarTwitter: lerBooleanConfig(
            req.body.mostrarTwitter,
            atual.home.mostrarTwitter,
          ),
          mostrarPortais: lerBooleanConfig(
            req.body.mostrarPortais,
            atual.home.mostrarPortais,
          ),
          carrosselAutoRss: lerBooleanConfig(
            req.body.carrosselAutoRss,
            atual.home.carrosselAutoRss,
          ),
          limiteNoticias: Math.min(
            Math.max(
              Number(req.body.limiteNoticias) || atual.home.limiteNoticias,
              1,
            ),
            100,
          ),
          limiteRss: Math.min(
            Math.max(Number(req.body.limiteRss) || atual.home.limiteRss, 1),
            100,
          ),
          limiteJogos: Math.max(
            Number(req.body.limiteJogos) || atual.home.limiteJogos,
            1,
          ),
          limiteCarrossel: Math.min(
            Math.max(
              Number(req.body.limiteCarrossel) || atual.home.limiteCarrossel,
              1,
            ),
            20,
          ),
          limiteVideos: Math.min(
            Math.max(
              Number(req.body.limiteVideos) || atual.home.limiteVideos,
              1,
            ),
            10,
          ),
          modoVideos: req.body.modoVideos === "manual" ? "manual" : "auto",
          textoBotaoVideo:
            req.body.textoBotaoVideo !== undefined
              ? req.body.textoBotaoVideo
              : atual.home.textoBotaoVideo || "Clique na imagem para assistir",
          videosCorBotao:
            req.body.videosCorBotao || atual.home.videosCorBotao || "#dc3545",
          videosIntervalo:
            req.body.videosIntervalo !== undefined
              ? Math.min(Math.max(Number(req.body.videosIntervalo), 0), 60)
              : (atual.home.videosIntervalo ?? 5),
          videosProporcao:
            req.body.videosProporcao || atual.home.videosProporcao || "16/9",
          temaCarrossel:
            req.body.temaCarrossel === "escuro" ? "escuro" : "claro",
          modeloCarrossel: MODELOS_CARROSSEL_VALIDOS.has(
            req.body.modeloCarrossel,
          )
            ? req.body.modeloCarrossel
            : atual.home.modeloCarrossel,
          alturaCarrossel: ALTURAS_CARROSSEL_VALIDAS.has(
            req.body.alturaCarrossel,
          )
            ? req.body.alturaCarrossel
            : atual.home.alturaCarrossel,
          autoplayCarrossel: Math.min(
            Math.max(
              Number(req.body.autoplayCarrossel) ||
                atual.home.autoplayCarrossel,
              3,
            ),
            20,
          ),
          mostrarResumoCarrossel: lerBooleanConfig(
            req.body.mostrarResumoCarrossel,
            atual.home.mostrarResumoCarrossel,
          ),
          mostrarMiniaturasCarrossel: lerBooleanConfig(
            req.body.mostrarMiniaturasCarrossel,
            atual.home.mostrarMiniaturasCarrossel,
          ),
          mostrarContadorCarrossel: lerBooleanConfig(
            req.body.mostrarContadorCarrossel,
            atual.home.mostrarContadorCarrossel,
          ),
          mostrarSetasCarrossel: lerBooleanConfig(
            req.body.mostrarSetasCarrossel,
            atual.home.mostrarSetasCarrossel,
          ),
          mostrarDotsCarrossel: lerBooleanConfig(
            req.body.mostrarDotsCarrossel,
            atual.home.mostrarDotsCarrossel,
          ),
          efeitoCamaleao: lerBooleanConfig(
            req.body.efeitoCamaleao,
            atual.home.efeitoCamaleao,
          ),
          widgets: {
            maisLidas: {
              titulo:
                req.body.widgetMaisLidasTitulo !== undefined
                  ? req.body.widgetMaisLidasTitulo
                  : atual.home.widgets?.maisLidas?.titulo || "Mais lidas",
              subtitulo:
                req.body.widgetMaisLidasSubtitulo !== undefined
                  ? req.body.widgetMaisLidasSubtitulo
                  : atual.home.widgets?.maisLidas?.subtitulo || "",
              icone: ICONES_WIDGET_VALIDOS.has(req.body.widgetMaisLidasIcone)
                ? req.body.widgetMaisLidasIcone
                : atual.home.widgets?.maisLidas?.icone || "grafico",
              layout: LAYOUTS_WIDGET_VALIDOS.maisLidas.has(
                req.body.widgetMaisLidasLayout,
              )
                ? req.body.widgetMaisLidasLayout
                : atual.home.widgets?.maisLidas?.layout || "lista",
            },
            jogos: {
              titulo:
                req.body.widgetJogosTitulo !== undefined
                  ? req.body.widgetJogosTitulo
                  : atual.home.widgets?.jogos?.titulo || "Agenda de jogos",
              subtitulo:
                req.body.widgetJogosSubtitulo !== undefined
                  ? req.body.widgetJogosSubtitulo
                  : atual.home.widgets?.jogos?.subtitulo || "",
              icone: ICONES_WIDGET_VALIDOS.has(req.body.widgetJogosIcone)
                ? req.body.widgetJogosIcone
                : atual.home.widgets?.jogos?.icone || "bola",
              layout: LAYOUTS_WIDGET_VALIDOS.jogos.has(
                req.body.widgetJogosLayout,
              )
                ? req.body.widgetJogosLayout
                : atual.home.widgets?.jogos?.layout || "cards",
            },
            enquete: {
              titulo:
                req.body.widgetEnqueteTitulo !== undefined
                  ? req.body.widgetEnqueteTitulo
                  : atual.home.widgets?.enquete?.titulo || "Enquete",
              subtitulo:
                req.body.widgetEnqueteSubtitulo !== undefined
                  ? req.body.widgetEnqueteSubtitulo
                  : atual.home.widgets?.enquete?.subtitulo || "",
              icone: ICONES_WIDGET_VALIDOS.has(req.body.widgetEnqueteIcone)
                ? req.body.widgetEnqueteIcone
                : atual.home.widgets?.enquete?.icone || "enquete",
              layout: LAYOUTS_WIDGET_VALIDOS.enquete.has(
                req.body.widgetEnqueteLayout,
              )
                ? req.body.widgetEnqueteLayout
                : atual.home.widgets?.enquete?.layout || "barras",
            },
            tabela: {
              titulo:
                req.body.widgetTabelaTitulo !== undefined
                  ? req.body.widgetTabelaTitulo
                  : atual.home.widgets?.tabela?.titulo || "Brasileirão",
              subtitulo:
                req.body.widgetTabelaSubtitulo !== undefined
                  ? req.body.widgetTabelaSubtitulo
                  : atual.home.widgets?.tabela?.subtitulo || "",
              icone: ICONES_WIDGET_VALIDOS.has(req.body.widgetTabelaIcone)
                ? req.body.widgetTabelaIcone
                : atual.home.widgets?.tabela?.icone || "trofeu",
              layout: LAYOUTS_WIDGET_VALIDOS.tabela.has(
                req.body.widgetTabelaLayout,
              )
                ? req.body.widgetTabelaLayout
                : atual.home.widgets?.tabela?.layout || "completo",
            },
            odds: {
              titulo:
                req.body.widgetOddsTitulo !== undefined
                  ? req.body.widgetOddsTitulo
                  : atual.home.widgets?.odds?.titulo || "Odds",
              subtitulo:
                req.body.widgetOddsSubtitulo !== undefined
                  ? req.body.widgetOddsSubtitulo
                  : atual.home.widgets?.odds?.subtitulo || "",
              icone: ICONES_WIDGET_VALIDOS.has(req.body.widgetOddsIcone)
                ? req.body.widgetOddsIcone
                : atual.home.widgets?.odds?.icone || "fogo",
              layout: LAYOUTS_WIDGET_VALIDOS.odds.has(req.body.widgetOddsLayout)
                ? req.body.widgetOddsLayout
                : atual.home.widgets?.odds?.layout || "cards",
            },
            videos: {
              titulo:
                req.body.widgetVideosTitulo !== undefined
                  ? req.body.widgetVideosTitulo
                  : atual.home.widgets?.videos?.titulo || "Últimos Vídeos",
              subtitulo:
                req.body.widgetVideosSubtitulo !== undefined
                  ? req.body.widgetVideosSubtitulo
                  : atual.home.widgets?.videos?.subtitulo || "",
              icone: ICONES_WIDGET_VALIDOS.has(req.body.widgetVideosIcone)
                ? req.body.widgetVideosIcone
                : atual.home.widgets?.videos?.icone || "play",
              layout: LAYOUTS_WIDGET_VALIDOS.videos.has(
                req.body.widgetVideosLayout,
              )
                ? req.body.widgetVideosLayout
                : atual.home.widgets?.videos?.layout || "carrossel",
            },
            twitter: {
              titulo:
                req.body.widgetTwitterTitulo !== undefined
                  ? req.body.widgetTwitterTitulo
                  : atual.home.widgets?.twitter?.titulo ||
                    "Comunidade Alvinegra",
              subtitulo:
                req.body.widgetTwitterSubtitulo !== undefined
                  ? req.body.widgetTwitterSubtitulo
                  : atual.home.widgets?.twitter?.subtitulo || "",
              icone: ICONES_WIDGET_VALIDOS.has(req.body.widgetTwitterIcone)
                ? req.body.widgetTwitterIcone
                : atual.home.widgets?.twitter?.icone || "twitter",
              layout: LAYOUTS_WIDGET_VALIDOS.twitter.has(
                req.body.widgetTwitterLayout,
              )
                ? req.body.widgetTwitterLayout
                : atual.home.widgets?.twitter?.layout || "cards",
              tempoExibicao:
                req.body.widgetTwitterTempoExibicao !== undefined
                  ? Math.max(1, Number(req.body.widgetTwitterTempoExibicao))
                  : atual.home.widgets?.twitter?.tempoExibicao || 5,
              tipoTransicao:
                req.body.widgetTwitterTipoTransicao ||
                atual.home.widgets?.twitter?.tipoTransicao ||
                "slide",
              velocidadeTransicao:
                req.body.widgetTwitterVelocidade !== undefined
                  ? Math.max(100, Number(req.body.widgetTwitterVelocidade))
                  : atual.home.widgets?.twitter?.velocidadeTransicao || 500,
              quantidadePorConta:
                req.body.widgetTwitterQtdConta !== undefined
                  ? Math.max(1, Number(req.body.widgetTwitterQtdConta))
                  : atual.home.widgets?.twitter?.quantidadePorConta || 3,
              mostrarMidia:
                req.body.widgetTwitterMostrarMidia !== undefined
                  ? lerBooleanConfig(req.body.widgetTwitterMostrarMidia)
                  : atual.home.widgets?.twitter?.mostrarMidia !== false,
            },
            portais: {
              titulo:
                req.body.widgetPortaisTitulo !== undefined
                  ? req.body.widgetPortaisTitulo
                  : atual.home.widgets?.portais?.titulo ||
                    "Últimas dos Portais",
              subtitulo:
                req.body.widgetPortaisSubtitulo !== undefined
                  ? req.body.widgetPortaisSubtitulo
                  : atual.home.widgets?.portais?.subtitulo ||
                    "Notícias de outras fontes",
              icone: ICONES_WIDGET_VALIDOS.has(req.body.widgetPortaisIcone)
                ? req.body.widgetPortaisIcone
                : atual.home.widgets.portais?.icone || "lista",
              layout: LAYOUTS_WIDGET_VALIDOS.portais.has(
                req.body.widgetPortaisLayout,
              )
                ? req.body.widgetPortaisLayout
                : atual.home.widgets.portais?.layout || "lista",
            },
          },
          ordemWidgets:
            req.body.ordemWidgets !== undefined
              ? parseCarrosselIds(req.body.ordemWidgets)
              : atual.home.ordemWidgets,
          carrosselIds:
            req.body.carrosselIds !== undefined &&
            String(req.body.carrosselIds).trim() !== ""
              ? parseCarrosselIds(req.body.carrosselIds).slice(0, 20)
              : atual.home.carrosselIds,
          portaisPermitidos: req.body.portaisPermitidos
            ? parseCarrosselIds(req.body.portaisPermitidos)
            : atual.home.portaisPermitidos,
          casasDeApostasPermitidas: req.body.casasDeApostasPermitidas
            ? parseCarrosselIds(req.body.casasDeApostasPermitidas)
            : atual.home.casasDeApostasPermitidas,
          casaDeApostaDestaque:
            req.body.casaDeApostaDestaque !== undefined
              ? req.body.casaDeApostaDestaque
              : atual.home.casaDeApostaDestaque || "VBET",
          rssCustom: atual.home.rssCustom,
          mostrarPatrocinadores: lerBooleanConfig(
            req.body.mostrarPatrocinadores,
            atual.home.mostrarPatrocinadores,
          ),
          patrocinadoresTitulo:
            req.body.patrocinadoresTitulo !== undefined
              ? req.body.patrocinadoresTitulo
              : atual.home.patrocinadoresTitulo || "",
          patrocinadoresAltura: Math.min(
            Math.max(
              Number(req.body.patrocinadoresAltura) ||
                atual.home.patrocinadoresAltura,
              20,
            ),
            100,
          ),
          patrocinadoresCorFundo:
            req.body.patrocinadoresCorFundo ||
            atual.home.patrocinadoresCorFundo ||
            "#f8f9fa",
          patrocinadoresCorTexto:
            req.body.patrocinadoresCorTexto ||
            atual.home.patrocinadoresCorTexto ||
            "#6c757d",
          patrocinadoresVelocidade: Math.min(
            Math.max(
              Number(req.body.patrocinadoresVelocidade) ||
                atual.home.patrocinadoresVelocidade,
              5,
            ),
            100,
          ),
          tamanhoFotoAutor:
            req.body.tamanhoFotoAutor !== undefined
              ? Math.min(Math.max(Number(req.body.tamanhoFotoAutor), 40), 120)
              : atual.home.tamanhoFotoAutor || 70,
        },
      };

      if (normalizarBoolean(req.body.removerLogo)) config.logoUrl = "";
      if (normalizarBoolean(req.body.removerFavicon)) config.faviconUrl = "";
      if (normalizarBoolean(req.body.removerBannerMarca))
        config.bannerMarcaUrl = "";
      if (normalizarBoolean(req.body.removerFundoHeader))
        config.fundoHeaderImagemUrl = "";
      if (normalizarBoolean(req.body.removerFundoSite))
        config.fundoSiteImagemUrl = "";
      if (normalizarBoolean(req.body.removerImagemPadrao))
        config.imagemPadraoUrl = "";
      if (normalizarBoolean(req.body.removerBuscaImagem))
        config.buscaImagemUrl = "";

      await salvarJSON(PATH_CONFIG, config);
      res.json(normalizarConfig(config));

      // Invalida o cache do YouTube se o canal ou a quantidade mudar
      if (
        atual.youtubeChannelId !== config.youtubeChannelId ||
        atual.home.limiteVideos !== config.home.limiteVideos ||
        atual.home.modoVideos !== config.home.modoVideos
      ) {
        resetarCacheYouTube();
      }

      // Se o painel alterou as casas de apostas, dispara o robô de raspagem na mesma hora!
      if (
        JSON.stringify(atual.home.casasDeApostasPermitidas) !==
          JSON.stringify(config.home.casasDeApostasPermitidas) ||
        atual.home.casaDeApostaDestaque !== config.home.casaDeApostaDestaque
      ) {
        atualizarCacheOdds(
          config.home.casasDeApostasPermitidas,
          config.home.casaDeApostaDestaque,
        ).catch(console.error);
      }

      // Se o painel alterou os portais parceiros, dispara o robô RSS novamente
      if (
        JSON.stringify(atual.home.portaisPermitidos) !==
        JSON.stringify(config.home.portaisPermitidos)
      ) {
        atualizarCacheDeNoticiasRSS().catch(console.error);
      }
    } catch (error) {
      console.error("Erro ao salvar config:", error);
      res.status(500).json({ erro: "Erro interno ao salvar configurações." });
    }
  },
);

app.put("/api/config/carrossel", exigirPermissaoAdmin, async (req, res) => {
  try {
    const atual = normalizarConfig(await lerJSON(PATH_CONFIG, {}));
    const limite = Math.min(
      Math.max(Number(req.body.limite) || atual.home.limiteCarrossel, 1),
      20,
    );
    atual.home.carrosselIds = parseCarrosselIds(
      req.body.ids ?? req.body.carrosselIds,
    ).slice(0, limite);
    await salvarJSON(PATH_CONFIG, atual);
    res.json({
      carrosselIds: atual.home.carrosselIds,
      home: atual.home,
    });
  } catch (error) {
    console.error("Erro ao salvar config carrossel:", error);
    res
      .status(500)
      .json({ erro: "Erro interno ao salvar configurações do carrossel." });
  }
});

app.get("/api/videos", async (req, res) => {
  const currentTime = Date.now();
  const config = normalizarConfig(await lerJSON(PATH_CONFIG, {}));
  const modo = config.home.modoVideos || "auto";
  const textoBotao = config.home.textoBotaoVideo || "";

  if (modo === "manual") {
    let manuais = await lerJSON(PATH_VIDEOS, []);
    manuais = manuais
      .filter((v) => v.ativo !== false)
      .slice(0, config.home.limiteVideos || 3);
    return res.json({ source: "manual", data: manuais, textoBotao });
  }

  if (getVideoCache() && currentTime - getLastFetchTime() < CACHE_DURATION) {
    return res.json({ source: "cache", data: getVideoCache(), textoBotao });
  }

  try {
    const videos = await fetchLatestVideos(config);
    setVideoCache(videos);
    setLastFetchTime(currentTime);

    res.json({ source: "api", data: videos, textoBotao });
  } catch (error) {
    console.error("Erro no servidor backend (YouTube):", error.message);

    if (getVideoCache() && getVideoCache().length > 0) {
      return res.json({
        source: "cache_fallback",
        data: getVideoCache(),
        textoBotao,
      });
    }

    // Fallback de emergência: tenta carregar vídeos do banco manual
    try {
      let manuais = await lerJSON(PATH_VIDEOS, []);
      manuais = manuais
        .filter((v) => v.ativo !== false)
        .slice(0, config.home.limiteVideos || 3);
      if (manuais.length > 0) {
        return res.json({
          source: "manual_fallback",
          data: manuais,
          textoBotao,
        });
      }
    } catch (e) {}

    res
      .status(500)
      .json({ error: "Não foi possível obter os vídeos do YouTube." });
  }
});

app.get("/api/videos-gerenciador", async (req, res) => {
  res.json(await lerJSON(PATH_VIDEOS, []));
});

app.post("/api/videos-gerenciador", exigirPermissaoAdmin, async (req, res) => {
  const videos = await lerJSON(PATH_VIDEOS, []);
  const novo = {
    id: Date.now().toString(),
    titulo: req.body.titulo || "",
    link: req.body.link || "",
    thumbnail: req.body.thumbnail || "",
    ativo: req.body.ativo !== false,
    data: new Date().toISOString(),
  };
  videos.unshift(novo);
  await salvarJSON(PATH_VIDEOS, videos);
  res.status(201).json(novo);
});

app.put(
  "/api/videos-gerenciador/:id",
  exigirPermissaoAdmin,
  async (req, res) => {
    const videos = await lerJSON(PATH_VIDEOS, []);
    const idx = videos.findIndex((v) => String(v.id) === String(req.params.id));
    if (idx === -1)
      return res.status(404).json({ erro: "Vídeo não encontrado." });
    videos[idx] = {
      ...videos[idx],
      titulo: req.body.titulo || videos[idx].titulo,
      link: req.body.link || videos[idx].link,
      thumbnail: req.body.thumbnail || videos[idx].thumbnail,
      ativo: normalizarBoolean(req.body.ativo),
    };
    await salvarJSON(PATH_VIDEOS, videos);
    res.json(videos[idx]);
  },
);

app.delete(
  "/api/videos-gerenciador/:id",
  exigirPermissaoAdmin,
  async (req, res) => {
    const videos = await lerJSON(PATH_VIDEOS, []);
    await salvarJSON(
      PATH_VIDEOS,
      videos.filter((v) => String(v.id) !== String(req.params.id)),
    );
    res.json({ mensagem: "Vídeo excluído." });
  },
);
app.get("/api/rss", async (req, res) => {
  if (!servidorRssPronto) {
    return res.status(503).json({
      erro: "O servidor esta carregando as fotos pela primeira vez. Recarregue em instantes.",
    });
  }
  const config = normalizarConfig(await lerJSON(PATH_CONFIG, {}));
  res.json(cacheDeNoticiasRSS.slice(0, config.home.limiteRss));
});

app.get("/api/noticias", async (req, res) => {
  const config = normalizarConfig(await lerJSON(PATH_CONFIG, {}));
  try {
    const noticias = (await lerJSON(PATH_NOTICIAS, [])).map((noticia) =>
      normalizarNoticia(noticia),
    );
    const termo = String(req.query.q || "")
      .trim()
      .toLowerCase();
    const termosBusca = termo ? termo.split(/\s+/) : [];
    const categoria = String(req.query.categoria || "")
      .trim()
      .toLowerCase();
    const autorBusca = String(req.query.autor || "")
      .trim()
      .toLowerCase();

    let rss = [];
    if (isRssPronto() && Array.isArray(getCacheRSS())) {
      rss = getCacheRSS().map((n) => {
        const hashId = Buffer.from(n.link || "")
          .toString("base64")
          .replace(/[^a-zA-Z0-9]/g, "")
          .slice(-25);
        const id = `rss-${hashId}`;
        const custom = config.home.rssCustom?.[id] || {};
        return {
          id: id,
          slug: id,
          titulo: custom.titulo || n.titulo,
          resumo: custom.resumo || n.resumo,
          conteudo: custom.conteudo || n.conteudo || custom.resumo || n.resumo,
          categoria: n.portal,
          autor: n.portal,
          tags: [],
          status: "publicado",
          destaqueCarousel: false,
          data: n.data,
          imagemUrl:
            custom.imagemUrl !== undefined ? custom.imagemUrl : n.imagem,
          visualizacoes: 0,
          linkExterno: n.linkResolvido || n.link,
          isRss: true,
          portal: n.portal,
        };
      });
    }

    const base =
      req.query.admin === "true"
        ? [...noticias, ...rss]
        : [...noticias.filter(noticiaPublicavel), ...rss];
    const filtradas = base.filter((noticia) => {
      const texto =
        `${noticia.titulo} ${noticia.resumo} ${noticia.conteudo} ${noticia.categoria} ${(noticia.tags || []).join(" ")}`.toLowerCase();
      // Verifica se TODAS as palavras digitadas estão presentes no texto da notícia
      const bateBusca =
        termosBusca.length === 0 || termosBusca.every((t) => texto.includes(t));
      const bateCategoria =
        !categoria || seo.categoriaCombina(noticia, categoria);
      const bateAutor =
        !autorBusca ||
        (noticia.autor && noticia.autor.trim().toLowerCase() === autorBusca);
      return bateBusca && bateCategoria && bateAutor;
    });
    const ordenadas = [...filtradas].sort(
      (a, b) =>
        new Date(b.data || 0).getTime() - new Date(a.data || 0).getTime(),
    );

    if (req.query.admin === "true") {
      return res.json(ordenadas);
    }

    if (req.query.widgetRss === "true") {
      return res.json(
        rss
          .filter((n) => n.portal !== "FOGÃONET")
          .slice(0, config.home.limiteRss),
      );
    }

    if (req.query.maisLidas === "true") {
      return res.json(
        [...ordenadas]
          .sort((a, b) => (b.visualizacoes || 0) - (a.visualizacoes || 0))
          .slice(0, 5),
      );
    }

    const gridBase = ordenadas.filter(
      (n) => !n.isRss || n.portal === "FOGÃONET",
    );

    const pagina = Math.max(parseInt(req.query.pagina, 10) || 1, 1);
    const limite = Math.max(parseInt(req.query.limite, 10) || 6, 1);
    const startIndex = (pagina - 1) * limite;
    const grid = gridBase.slice(startIndex, startIndex + limite);
    const totalPaginas = Math.max(Math.ceil(gridBase.length / limite), 1);
    const destaques = await obterDestaquesCarrossel(gridBase);

    // =======================================================
    // INJEÇÃO DA LIVE DO YOUTUBE NO CARROSSEL PRINCIPAL
    // =======================================================
    try {
      const currentTime = Date.now();
      let vCache = getVideoCache();
      if (!vCache || currentTime - getLastFetchTime() >= CACHE_DURATION) {
        vCache = await fetchLatestVideos(config).catch(() => getVideoCache());
        setVideoCache(vCache);
        setLastFetchTime(currentTime);
      }
      if (vCache && Array.isArray(vCache)) {
        const liveVideos = vCache.filter((v) => v.isLive);
        if (liveVideos.length > 0) {
          // Reverte para manter a prioridade (Setor Visitante, TF, Arena) empurrando no começo
          liveVideos.reverse().forEach((liveVideo) => {
            if (!destaques.some((d) => d.id === liveVideo.id)) {
              destaques.unshift({
                id: liveVideo.id,
                titulo: liveVideo.titulo,
                resumo: `🔴 Acompanhe a transmissão ao vivo agora mesmo no canal ${liveVideo.autor || "YouTube"}!`,
                categoria: "AO VIVO",
                autor: liveVideo.autor || "YouTube",
                data: new Date().toISOString(),
                imagemUrl: liveVideo.thumbnail,
                linkExterno: liveVideo.link,
                isYouTube: true, // Flag para o frontend saber o que fazer
                destaqueCarousel: true,
              });
            }
          });

          while (destaques.length > (config.home.limiteCarrossel || 5)) {
            destaques.pop();
          }
        }
      }
    } catch (e) {
      console.error("Erro ao injetar live no carrossel:", e.message);
    }

    res.json({
      destaques,
      grid,
      paginaAtual: pagina,
      totalPaginas,
      totalItens: gridBase.length,
    });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar noticias." });
  }
});

app.get("/api/categorias", async (req, res) => {
  const noticias = (await lerJSON(PATH_NOTICIAS, [])).map((noticia) =>
    normalizarNoticia(noticia),
  );
  const publicadas = noticias.filter(noticiaPublicavel);
  const categorias = [
    ...new Set(publicadas.map((noticia) => noticia.categoria || "Geral")),
  ].sort();
  res.json(categorias);
});

app.get("/api/noticias/:identificador", async (req, res) => {
  const noticias = (await lerJSON(PATH_NOTICIAS, [])).map((noticia) =>
    normalizarNoticia(noticia),
  );
  let noticia = noticias.find(
    (item) =>
      String(item.id) === String(req.params.identificador) ||
      String(item.slug) === String(req.params.identificador),
  );

  if (!noticia && isRssPronto()) {
    const config = normalizarConfig(await lerJSON(PATH_CONFIG, {}));
    const nRss = getCacheRSS().find((n) => {
      const hashId = Buffer.from(n.link || "")
        .toString("base64")
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(-25);
      const id = `rss-${hashId}`;
      return id === req.params.identificador;
    });
    if (nRss && nRss.portal === "FOGÃONET") {
      const id = req.params.identificador;
      const custom = config.home.rssCustom?.[id] || {};
      noticia = {
        id: id,
        slug: id,
        titulo: custom.titulo || nRss.titulo,
        resumo: custom.resumo || nRss.resumo,
        conteudo:
          custom.conteudo || nRss.conteudo || custom.resumo || nRss.resumo,
        categoria: nRss.portal,
        autor: nRss.portal,
        tags: [],
        status: "publicado",
        data: nRss.data,
        imagemUrl:
          custom.imagemUrl !== undefined ? custom.imagemUrl : nRss.imagem,
        isRss: true,
        portal: nRss.portal,
        linkExterno: nRss.linkResolvido || nRss.link,
      };
    }
  }

  if (!noticia)
    return res.status(404).json({ erro: "Noticia nao encontrada." });
  if (!noticiaPublicavel(noticia) && !noticia.isRss && !estaLogado(req)) {
    return res.status(404).json({ erro: "Noticia nao encontrada." });
  }
  res.json(noticia);
});

app.post(
  "/api/noticias",
  exigirLoginAPI,
  upload.single("imagem"),
  async (req, res) => {
    try {
      const noticias = (await lerJSON(PATH_NOTICIAS, [])).map((noticia) =>
        normalizarNoticia(noticia),
      );
      const titulo = req.body.titulo || "Sem titulo";
      const novaNoticia = {
        id: Date.now().toString(),
        slug: garantirSlugUnico(noticias, titulo),
        titulo,
        resumo: req.body.resumo || "",
        conteudo: formatarConteudoHtml(
          req.body.conteudo || req.body.resumo || "",
        ),
        categoria: req.body.categoria || "Geral",
        autor: req.body.autor || "Redacao",
        tags: String(req.body.tags || "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        status: req.body.status === "rascunho" ? "rascunho" : "publicado",
        destaqueCarousel: normalizarBoolean(req.body.destaque),
        data: new Date().toISOString(),
        imagemUrl: await resolverImagemNoticia(req),
        visualizacoes: 0,
      };

      noticias.unshift(novaNoticia);
      await salvarJSON(PATH_NOTICIAS, noticias);
      res.status(201).json(novaNoticia);
    } catch (error) {
      res.status(500).json({ erro: "Erro ao criar noticia." });
    }
  },
);

app.put(
  "/api/noticias/:id",
  exigirLoginAPI,
  upload.single("imagem"),
  async (req, res) => {
    try {
      if (String(req.params.id).startsWith("rss-")) {
        const config = normalizarConfig(await lerJSON(PATH_CONFIG, {}));
        if (!config.home.rssCustom) config.home.rssCustom = {};

        let customData = config.home.rssCustom[req.params.id] || {};
        if (req.body.titulo) customData.titulo = req.body.titulo;
        if (req.body.resumo) customData.resumo = req.body.resumo;
        if (req.body.conteudo) customData.conteudo = req.body.conteudo;

        const removerImagem = normalizarBoolean(req.body.removerImagem);
        if (removerImagem) {
          customData.imagemUrl = "";
        } else if (req.file) {
          customData.imagemUrl = await uploadParaSupabase(req.file);
        } else if (req.body.imagemUrl) {
          customData.imagemUrl = req.body.imagemUrl;
        }

        config.home.rssCustom[req.params.id] = customData;
        await salvarJSON(PATH_CONFIG, config);
        return res.json({ id: req.params.id, ...customData });
      }

      const noticias = (await lerJSON(PATH_NOTICIAS, [])).map((noticia) =>
        normalizarNoticia(noticia),
      );
      const idx = noticias.findIndex(
        (item) => String(item.id) === String(req.params.id),
      );
      if (idx === -1)
        return res.status(404).json({ erro: "Noticia nao encontrada." });
      const titulo = req.body.titulo || noticias[idx].titulo;
      const removerImagem = normalizarBoolean(req.body.removerImagem);

      noticias[idx] = {
        ...noticias[idx],
        titulo,
        slug: garantirSlugUnico(noticias, titulo, noticias[idx].id),
        resumo: req.body.resumo || "",
        conteudo: formatarConteudoHtml(
          req.body.conteudo || req.body.resumo || "",
        ),
        categoria: req.body.categoria || "Geral",
        autor: req.body.autor || "Redacao",
        tags: String(req.body.tags || "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        status: req.body.status === "rascunho" ? "rascunho" : "publicado",
        destaqueCarousel: normalizarBoolean(req.body.destaque),
        imagemUrl: removerImagem
          ? ""
          : await resolverImagemNoticia(req, noticias[idx].imagemUrl),
      };

      await salvarJSON(PATH_NOTICIAS, noticias);
      res.json(noticias[idx]);
    } catch (error) {
      res.status(500).json({ erro: "Erro ao atualizar noticia." });
    }
  },
);

app.delete(
  "/api/noticias/rascunhos/limpar",
  exigirLoginAPI,
  async (req, res) => {
    try {
      let noticias = await lerJSON(PATH_NOTICIAS, []);
      const totalAntes = noticias.length;

      noticias = noticias.filter((item) => item.status !== "rascunho");
      const apagados = totalAntes - noticias.length;

      await salvarJSON(PATH_NOTICIAS, noticias);

      res.json({
        mensagem: `${apagados} rascunho(s) apagado(s) com sucesso!`,
        apagados,
      });
    } catch (error) {
      res.status(500).json({ erro: "Erro ao limpar rascunhos." });
    }
  },
);

app.delete("/api/noticias/:id", exigirLoginAPI, async (req, res) => {
  try {
    const noticias = await lerJSON(PATH_NOTICIAS, []);
    const filtradas = noticias.filter(
      (item) => String(item.id) !== String(req.params.id),
    );
    await salvarJSON(PATH_NOTICIAS, filtradas);

    const config = normalizarConfig(await lerJSON(PATH_CONFIG, {}));
    config.home.carrosselIds = config.home.carrosselIds.filter(
      (itemId) => String(itemId) !== String(req.params.id),
    );
    await salvarJSON(PATH_CONFIG, config);

    res.json({ mensagem: "Noticia excluida." });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao excluir noticia." });
  }
});

app.post("/api/noticias/:identificador/view", async (req, res) => {
  try {
    const noticias = await lerJSON(PATH_NOTICIAS, []);
    const idx = noticias.findIndex(
      (item) =>
        String(item.id) === String(req.params.identificador) ||
        String(item.slug) === String(req.params.identificador),
    );
    if (idx !== -1) {
      noticias[idx].visualizacoes = (noticias[idx].visualizacoes || 0) + 1;
      await salvarJSON(PATH_NOTICIAS, noticias);
    }
    res.sendStatus(200);
  } catch {
    res.sendStatus(500);
  }
});

app.get("/api/noticias/:id/relacionadas", async (req, res) => {
  try {
    const noticias = (await lerJSON(PATH_NOTICIAS, [])).map((noticia) =>
      normalizarNoticia(noticia),
    );
    const noticiaAtual = noticias.find(
      (item) => String(item.id) === String(req.params.id),
    );

    if (!noticiaAtual) return res.json([]);

    const relacionadas = noticias
      .filter(
        (item) =>
          item.status !== "rascunho" &&
          String(item.id) !== String(req.params.id) &&
          item.categoria === noticiaAtual.categoria,
      )
      .slice(0, 3);
    res.json(relacionadas);
  } catch {
    res.status(500).json({ erro: "Erro ao buscar notícias relacionadas." });
  }
});

app.get("/api/enquete", async (req, res) => {
  res.json(
    await lerJSON(PATH_ENQUETE, { pergunta: "Sua opiniao?", opcoes: {} }),
  );
});

app.post("/api/enquete/votar", async (req, res) => {
  try {
    const { opcao } = req.body;
    const enquete = await lerJSON(PATH_ENQUETE, { pergunta: "", opcoes: {} });
    if (!enquete.opcoes || enquete.opcoes[opcao] === undefined) {
      return res.status(400).json({ erro: "Opcao invalida." });
    }
    enquete.opcoes[opcao] += 1;
    await salvarJSON(PATH_ENQUETE, enquete);
    res.json(enquete);
  } catch {
    res.sendStatus(500);
  }
});

app.post(
  "/api/enquete/configurar",
  exigirLoginAPI,
  upload.single("imagem"),
  async (req, res) => {
    try {
      let opcoes = [];
      try {
        opcoes = JSON.parse(req.body.opcoes);
      } catch (e) {
        opcoes = String(req.body.opcoes || "").split(",");
      }

      const enqueteAtual = await lerJSON(PATH_ENQUETE, {
        pergunta: "",
        opcoes: {},
      });
      let imagemUrl = enqueteAtual.imagemUrl || "";
      if (normalizarBoolean(req.body.removerImagemEnquete)) {
        imagemUrl = "";
      } else if (req.file) {
        imagemUrl = await uploadParaSupabase(req.file);
      }

      const novaEnquete = {
        pergunta: req.body.pergunta || "Nova enquete",
        imagemUrl,
        opcoes: {},
      };

      if (Array.isArray(opcoes)) {
        opcoes.forEach((opcao) => {
          const nome = String(opcao).trim();
          if (nome) novaEnquete.opcoes[nome] = 0;
        });
      }

      await salvarJSON(PATH_ENQUETE, novaEnquete);
      res.json(novaEnquete);
    } catch (error) {
      res.status(500).json({ erro: "Erro ao configurar enquete." });
    }
  },
);

app.use((err, req, res, next) => {
  if (!err) return next();
  if (err.code === "ENOENT") {
    return res.status(404).json({ erro: "Arquivo nao encontrado." });
  }
  if (
    err instanceof multer.MulterError ||
    /imagem|upload/i.test(err.message || "")
  ) {
    return res.status(400).json({ erro: err.message || "Erro no upload." });
  }
  next(err);
});

garantirEstrutura()
  .then(async () => {
    const noticias = await lerJSON(PATH_NOTICIAS, []);
    if (!noticias.length) {
      await salvarJSON(PATH_NOTICIAS, require("./data/noticias.seed.json"));
    }

    app.listen(PORT, async () => {
      console.log(`Portal rodando em http://localhost:${PORT}`);
      console.log(`Painel admin: http://localhost:${PORT}/admin.html`);
      console.log(`✅ SISTEMA INICIADO COM SUCESSO - TABELA ATIVADA!`);
      atualizarCacheDeNoticiasRSS();
      setInterval(atualizarCacheDeNoticiasRSS, 120000);
      atualizarTabelaBrasileirao();
      setInterval(atualizarTabelaBrasileirao, 86400000);

      const confOdds = normalizarConfig(await lerJSON(PATH_CONFIG, {}));
      atualizarCacheOdds(
        confOdds.home.casasDeApostasPermitidas,
        confOdds.home.casaDeApostaDestaque,
      );
      setInterval(
        async () => {
          const c = normalizarConfig(await lerJSON(PATH_CONFIG, {}));
          atualizarCacheOdds(
            c.home.casasDeApostasPermitidas,
            c.home.casaDeApostaDestaque,
          );
        },
        2 * 60 * 60 * 1000,
      ); // Atualiza a cada 2h e blinda o limite da cota gratuita de forma segura.
      atualizarCacheTwitter();
      setInterval(atualizarCacheTwitter, 30 * 60 * 1000); // Roda a cada 30 min para evitar bloqueio de IP no X
      atualizarAgendaAutomatica(); // O próprio robô define o setInterval baseado no status da partida!

      // O robô IA (Thiago Franklin) agora roda estritamente pelo agendamento interno (cron)
      // Isso impede o consumo acidental da cota do YouTube a cada reinicialização.
    });
  })
  .catch((error) => {
    console.error("Erro ao iniciar o servidor:", error);
    process.exit(1);
  });

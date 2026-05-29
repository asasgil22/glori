const puppeteer = require("puppeteer");
const fsSync = require("fs");
const path = require("path");
const { lerJSON, salvarJSON } = require("../config/database");

let buscarOddsBotafogo;
let buscarAgendaBotafogo;
try {
  const scraper = require("../../scraper");
  buscarOddsBotafogo = scraper.buscarOddsBotafogo;
  buscarAgendaBotafogo = scraper.buscarAgendaBotafogo;
} catch (e) {
  console.error("⚠️ Aviso: Erro ao carregar scraper.js:", e.message);
}

const PATH_TABELAS = path.join(__dirname, "../../data/tabelas.json");
const PATH_JOGOS = path.join(__dirname, "../../data/jogos.json");
const PATH_ESCUDOS = path.join(__dirname, "../../public/escudos");

// ==========================================
// 🧠 MEMÓRIA CACHE (Tabela + Emblemas)
// ==========================================
let cacheTabela = [];
let servidorTabelaPronto = false;

function obterEscudo(nomeDoTime) {
  const nomeLimpo = String(nomeDoTime)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const aliases = {
    botafogo: "botafogo",
    flamengo: "flamengo",
    fluminense: "fluminense",
    "vasco da gama": "vasco",
    vasco: "vasco",
    corinthians: "corinthians",
    "sao paulo": "sao-paulo",
    paulo: "sao-paulo",
    palmeiras: "palmeiras",
    santos: "santos",
    cruzeiro: "cruzeiro",
    "atletico-mg": "atletico-mg",
    mineiro: "atletico-mg",
    "atletico mineiro": "atletico-mg",
    gremio: "gremio",
    internacional: "internacional",
    "athletico-pr": "athletico-pr",
    "athletico pr": "athletico-pr",
    "atletico pr": "athletico-pr",
    paranaense: "athletico-pr",
    athletico: "athletico-pr",
    bahia: "bahia",
    vitoria: "vitoria",
    fortaleza: "fortaleza",
    cuiaba: "cuiaba",
    goianiense: "atletico-go",
    "atletico-go": "atletico-go",
    "atletico go": "atletico-go",
    "red bull": "bragantino",
    bragantino: "bragantino",
    juventude: "juventude",
    criciuma: "criciuma",
    coritiba: "coritiba",
    sport: "sport",
    goias: "goias",
    ceara: "ceara",
    "america-mg": "america-mg",
    "america mineiro": "america-mg",
    guarani: "guarani",
    "ponte preta": "ponte-preta",
    "vila nova": "vila-nova",
    crb: "crb",
    novorizontino: "novorizontino",
    operario: "operario",
    avai: "avai",
    chapecoense: "chapecoense",
    mirassol: "mirassol",
    mirasol: "mirassol",
    remo: "remo",
    paysandu: "paysandu",
    amazonas: "amazonas",
    ituano: "ituano",
    "botafogo-sp": "botafogo-sp",
    "botafogo sp": "botafogo-sp",
  };

  const chavesOrdenadas = Object.keys(aliases).sort(
    (a, b) => b.length - a.length,
  );
  let slugEncontrado = null;
  for (const chave of chavesOrdenadas) {
    if (nomeLimpo.includes(chave)) {
      slugEncontrado = aliases[chave];
      break;
    }
  }

  if (slugEncontrado) {
    try {
      const arquivos = fsSync.readdirSync(PATH_ESCUDOS);
      const regex = new RegExp(
        `^${slugEncontrado}\\.(png|svg|jpg|jpeg|webp)$`,
        "i",
      );
      const arquivoReal = arquivos.find((arq) => regex.test(arq));
      if (arquivoReal) return `/escudos/${arquivoReal}`;
    } catch (e) {
      if (fsSync.existsSync(path.join(PATH_ESCUDOS, `${slugEncontrado}.png`)))
        return `/escudos/${slugEncontrado}.png`;
      if (fsSync.existsSync(path.join(PATH_ESCUDOS, `${slugEncontrado}.svg`)))
        return `/escudos/${slugEncontrado}.svg`;
      if (fsSync.existsSync(path.join(PATH_ESCUDOS, `${slugEncontrado}.webp`)))
        return `/escudos/${slugEncontrado}.webp`;
    }
  }
  return "/escudos/escudo-padrao.png";
}

async function atualizarTabelaBrasileirao() {
  console.log(
    `[${new Date().toLocaleTimeString()}] 📊 Robô: Extração Universal (Terra/Gazeta)...`,
  );
  try {
    const tabelas = await lerJSON(PATH_TABELAS, []);
    let brIdx = tabelas.findIndex((t) => String(t.id) === "brasileirao");
    if (brIdx === -1) {
      tabelas.push({
        id: "brasileirao",
        campeonato: "Brasileirão Série A",
        autoAtualizar: true,
        times: [],
      });
      brIdx = tabelas.length - 1;
    }
    if (!tabelas[brIdx].autoAtualizar) {
      console.log(
        `[${new Date().toLocaleTimeString()}] 📊 Tabela no modo manual. Pausado.`,
      );
      cacheTabela = tabelas[brIdx].times || [];
      servidorTabelaPronto = true;
      return;
    }
  } catch (e) {}

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox"],
    });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(30000);

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
    });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    );
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      if (["image", "stylesheet", "media", "font"].includes(req.resourceType()))
        req.abort();
      else req.continue();
    });

    try {
      await page.goto(
        "https://www.terra.com.br/esportes/futebol/brasileiro-serie-a/tabela/",
        { waitUntil: "domcontentloaded", timeout: 15000 },
      );
      await page.waitForSelector("table tbody tr", { timeout: 8000 });
    } catch (e) {
      console.log(
        `[${new Date().toLocaleTimeString()}] ⚠️ Terra demorou. Usando Gazeta...`,
      );
      await page.goto(
        "https://www.gazetaesportiva.com/campeonatos/brasileiro-serie-a/",
        { waitUntil: "domcontentloaded", timeout: 15000 },
      );
      await page.waitForSelector("table tbody tr", { timeout: 8000 });
    }
    await new Promise((r) => setTimeout(r, 1000));

    const tabelaExtraida = await page.evaluate(() => {
      const linhas = Array.from(document.querySelectorAll("table tbody tr"));
      const times = [];
      linhas.forEach((tr) => {
        const celulas = Array.from(tr.querySelectorAll("td, th"))
          .map((c) => c.innerText.replace(/\s+/g, " ").trim())
          .filter((txt) => txt !== "");

        const idxNome = celulas.findIndex(
          (txt) =>
            /[A-Za-z]/.test(txt) &&
            txt.length > 2 &&
            !/sobe|desce|mantem/i.test(txt),
        );
        if (idxNome !== -1) {
          let posicao = celulas[0].replace(/\D/g, "");
          if (!posicao) {
            const match = celulas[idxNome].match(/^(\d+)/);
            if (match) posicao = match[1];
          }
          let nome = celulas[idxNome]
            .replace(/^[\dº°\-\s>»]+/, "")
            .replace(/[>»]+/g, "")
            .trim();
          const stats = celulas
            .slice(idxNome + 1)
            .filter((txt) => /^[\d\.\,\+\-]+%?$/.test(txt))
            .map((txt) => {
              if (txt === "-") return "0";
              return txt.replace(/[^\d\-]/g, "");
            });

          if (posicao && stats.length >= 8) {
            if (!times.some((t) => t.nome === nome)) {
              times.push({
                posicao,
                nome,
                pts: stats[0],
                j: stats[1],
                v: stats[2],
                e: stats[3],
                d: stats[4],
                sg: stats[7],
              });
            }
          }
        }
      });
      return times
        .sort((a, b) => parseInt(a.posicao) - parseInt(b.posicao))
        .slice(0, 20);
    });

    if (tabelaExtraida && tabelaExtraida.length === 20) {
      const timesFormatados = tabelaExtraida.map((time) => ({
        ...time,
        escudo: obterEscudo(time.nome),
      }));
      const tabelas = await lerJSON(PATH_TABELAS, []);
      let brIdx = tabelas.findIndex((t) => String(t.id) === "brasileirao");
      if (brIdx === -1) {
        tabelas.push({
          id: "brasileirao",
          campeonato: "Brasileirão Série A",
          autoAtualizar: true,
          times: [],
        });
        brIdx = tabelas.length - 1;
      }
      tabelas[brIdx].times = timesFormatados;
      await salvarJSON(PATH_TABELAS, tabelas);
      cacheTabela = timesFormatados;
      servidorTabelaPronto = true;
      console.log(
        `[${new Date().toLocaleTimeString()}] ✅ Tabela lida e formatada!`,
      );
    }
  } catch (error) {
    console.error(
      `[${new Date().toLocaleTimeString()}] ❌ Erro na tabela:`,
      error.message,
    );
  } finally {
    if (browser) await browser.close();
  }
}

// ==========================================
// 🧠 MEMÓRIA CACHE (Odds de Apostas)
// ==========================================
let cacheOdds = [];
let servidorOddsPronto = false;

async function atualizarCacheOdds(casasPermitidas, casaDestaque) {
  console.log(
    `[${new Date().toLocaleTimeString()}] 🎲 Robô: Sincronizando Odds do Botafogo...`,
  );
  try {
    if (typeof buscarOddsBotafogo !== "function")
      throw new Error("Scraper ausente.");
    const dadosSites = await buscarOddsBotafogo(casasPermitidas, casaDestaque);
    if (dadosSites && dadosSites.length > 0) {
      cacheOdds = dadosSites;
      servidorOddsPronto = true;
      console.log(
        `[${new Date().toLocaleTimeString()}] ✅ Odds atualizadas com sucesso!`,
      );
    } else {
      throw new Error("Scraper retornou array vazio.");
    }
  } catch (erro) {
    console.error(`❌ Erro nas Odds: ${erro.message}`);
    cacheOdds = [
      {
        casa: "Indisponível",
        adversario: "Aguardando",
        vitoria: "-",
        empate: "-",
        derrota: "-",
        destaque: false,
      },
    ];
    servidorOddsPronto = true;
  }
}

// ==========================================
// 🧠 MEMÓRIA CACHE (Agenda de Jogos)
// ==========================================
let agendaInterval;
async function atualizarAgendaAutomatica() {
  console.log(
    `[${new Date().toLocaleTimeString()}] 📅 Robô: Sincronizando Agenda e Matchday...`,
  );
  try {
    if (typeof buscarAgendaBotafogo !== "function") return;
    const jogosExtraidos = await buscarAgendaBotafogo();
    if (jogosExtraidos && jogosExtraidos.length > 0) {
      const jogosComEscudos = jogosExtraidos.map((jogo) => ({
        ...jogo,
        escudoMandante: obterEscudo(jogo.mandante),
        escudoVisitante: obterEscudo(jogo.visitante),
      }));

      await salvarJSON(PATH_JOGOS, jogosComEscudos);
      console.log(
        `[${new Date().toLocaleTimeString()}] ✅ Agenda sincronizada!`,
      );

      const temJogoAoVivo = jogosComEscudos.some(
        (j) => j.status === "inprogress",
      );
      if (agendaInterval) clearInterval(agendaInterval);

      if (temJogoAoVivo) {
        console.log(
          `[${new Date().toLocaleTimeString()}] 🔴 MATCHDAY ATIVADO! Atualizando placar por minuto...`,
        );
        agendaInterval = setInterval(atualizarAgendaAutomatica, 60 * 1000);
      } else {
        agendaInterval = setInterval(
          atualizarAgendaAutomatica,
          4 * 60 * 60 * 1000,
        );
      }
    }
  } catch (erro) {
    console.error(`❌ Erro na Agenda: ${erro.message}`);
    if (!agendaInterval)
      agendaInterval = setInterval(
        atualizarAgendaAutomatica,
        4 * 60 * 60 * 1000,
      );
  }
}

function getCacheTabela() {
  return cacheTabela;
}
function isTabelaPronta() {
  return servidorTabelaPronto;
}
function setCacheTabela(tabela) {
  cacheTabela = tabela;
}
function getCacheOdds() {
  return cacheOdds;
}
function isOddsPronto() {
  return servidorOddsPronto;
}

module.exports = {
  obterEscudo,
  atualizarTabelaBrasileirao,
  atualizarCacheOdds,
  atualizarAgendaAutomatica,
  getCacheTabela,
  isTabelaPronta,
  setCacheTabela,
  getCacheOdds,
  isOddsPronto,
};

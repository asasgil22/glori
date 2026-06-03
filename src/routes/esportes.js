const express = require("express");
const router = express.Router();
const path = require("path");
const { lerJSON, salvarJSON } = require("../config/database");
const { exigirPermissaoAdmin } = require("../middlewares/auth");
const {
  obterEscudo,
  getCacheTabela,
  isTabelaPronta,
  setCacheTabela,
  getCacheOdds,
  sincronizarElencoAPI,
} = require("../services/sportsService");

const PATH_TABELAS = path.join(__dirname, "../../data/tabelas.json");
const PATH_JOGOS = path.join(__dirname, "../../data/jogos.json");
const PATH_CONFIG = path.join(__dirname, "../../data/config.json");
const PATH_ELENCO = path.join(__dirname, "../../data/elenco.json");

function normalizarBoolean(valor) {
  return valor === true || valor === "true" || valor === "on" || valor === "1";
}

// ==========================================
// TABELAS
// ==========================================
router.get("/tabela", async (req, res) => {
  const tabelas = await lerJSON(PATH_TABELAS, []);
  const brasileirao = tabelas.find((t) => t.id === "brasileirao") || tabelas[0];
  if (brasileirao && brasileirao.times && brasileirao.times.length > 0) {
    return res.json(
      brasileirao.times.map((t) => ({ ...t, escudo: obterEscudo(t.nome) })),
    );
  }
  if (!isTabelaPronta()) {
    return res
      .status(503)
      .json({ erro: "A tabela está carregando, atualize em 15s..." });
  }
  res.json(
    getCacheTabela().map((t) => ({ ...t, escudo: obterEscudo(t.nome) })),
  );
});

router.get("/tabelas", async (req, res) => {
  const tabelas = await lerJSON(PATH_TABELAS, []);
  res.json(
    tabelas.map((tab) => ({
      ...tab,
      times: (tab.times || []).map((t) => ({
        ...t,
        escudo: obterEscudo(t.nome),
      })),
    })),
  );
});

router.post("/tabelas", exigirPermissaoAdmin, async (req, res) => {
  try {
    const tabelas = await lerJSON(PATH_TABELAS, []);
    const nova = {
      id: Date.now().toString(),
      campeonato: req.body.campeonato || "Novo Campeonato",
      autoAtualizar: normalizarBoolean(req.body.autoAtualizar),
      times: [],
    };
    tabelas.push(nova);
    await salvarJSON(PATH_TABELAS, tabelas);
    res.status(201).json(nova);
  } catch (e) {
    res.status(500).json({ erro: "Erro ao criar tabela." });
  }
});

router.put("/tabelas/:id", exigirPermissaoAdmin, async (req, res) => {
  try {
    const tabelas = await lerJSON(PATH_TABELAS, []);
    const idx = tabelas.findIndex(
      (t) => String(t.id) === String(req.params.id),
    );
    if (idx === -1)
      return res.status(404).json({ erro: "Tabela não encontrada." });
    if (req.body.campeonato !== undefined)
      tabelas[idx].campeonato = req.body.campeonato;
    if (req.body.autoAtualizar !== undefined)
      tabelas[idx].autoAtualizar = normalizarBoolean(req.body.autoAtualizar);
    if (req.body.times && Array.isArray(req.body.times)) {
      tabelas[idx].times = req.body.times.map((t) => ({
        ...t,
        escudo: obterEscudo(t.nome),
      }));
    }
    await salvarJSON(PATH_TABELAS, tabelas);
    if (tabelas[idx].id === "brasileirao") setCacheTabela(tabelas[idx].times);
    res.json(tabelas[idx]);
  } catch (e) {
    res.status(500).json({ erro: "Erro ao atualizar tabela." });
  }
});

router.delete("/tabelas/:id", exigirPermissaoAdmin, async (req, res) => {
  try {
    const tabelas = await lerJSON(PATH_TABELAS, []);
    await salvarJSON(
      PATH_TABELAS,
      tabelas.filter((t) => String(t.id) !== String(req.params.id)),
    );
    res.json({ mensagem: "Tabela excluída." });
  } catch (e) {
    res.status(500).json({ erro: "Erro ao excluir tabela." });
  }
});

// ==========================================
// ODDS
// ==========================================
router.get("/odds/botafogo", async (req, res) => {
  const odds = getCacheOdds();
  if (!odds || odds.length === 0) return res.json([]);

  const config = await lerJSON(PATH_CONFIG, {});
  const casaDestaqueUpper = (
    config.home?.casaDeApostaDestaque || "VBET"
  ).toUpperCase();

  const oddsDestaque = odds.filter(
    (o) => o.casa && o.casa.toUpperCase() === casaDestaqueUpper,
  );
  const oddsRestante = odds.filter(
    (o) => o.casa && o.casa.toUpperCase() !== casaDestaqueUpper,
  );

  oddsRestante.sort(
    (a, b) => parseFloat(b.vitoria || 0) - parseFloat(a.vitoria || 0),
  );

  let oddsFinal = [...oddsDestaque, ...oddsRestante].map((odd, index) => ({
    ...odd,
    destaque: index === 0 && oddsDestaque.length > 0,
  }));

  // INTEGRAÇÃO INTELIGENTE: Se o servidor estiver no Render e o scraper for bloqueado,
  // ele substitui o "Aguardando" pelo nome do adversário real cadastrado na Agenda de Jogos do Admin!
  try {
    const jogos = await lerJSON(PATH_JOGOS, []);
    const agora = new Date();
    // Pega o próximo jogo que ainda vai acontecer
    const proximoJogo =
      jogos.find(
        (j) =>
          new Date(j.dataHora) >= agora ||
          (j.placarMandante === null && j.placarVisitante === null),
      ) || jogos[0];

    if (proximoJogo) {
      const nomeMandante = String(proximoJogo.mandante || "").toLowerCase();
      const isBotafogoHome = nomeMandante.includes("bot");
      const adversarioReal = isBotafogoHome
        ? proximoJogo.visitante
        : proximoJogo.mandante;

      oddsFinal = oddsFinal.map((odd) => {
        if (odd.adversario === "Aguardando") {
          odd.adversario = adversarioReal;
        }
        return odd;
      });
    }
  } catch (e) {}

  res.json(oddsFinal);
});

// ==========================================
// JOGOS
// ==========================================
router.get("/jogos", async (req, res) =>
  res.json(await lerJSON(PATH_JOGOS, [])),
);

router.post("/jogos", exigirPermissaoAdmin, async (req, res) => {
  const jogos = await lerJSON(PATH_JOGOS, []);
  const novoJogo = {
    id: Date.now().toString(),
    campeonato: req.body.campeonato || "Campeonato",
    dataHora: req.body.dataHora,
    mandante: req.body.mandante || "MAND",
    visitante: req.body.visitante || "VIS",
    escudoMandante:
      req.body.escudoMandante || obterEscudo(req.body.mandante || "MAND"),
    escudoVisitante:
      req.body.escudoVisitante || obterEscudo(req.body.visitante || "VIS"),
    placarMandante: null,
    placarVisitante: null,
  };
  jogos.push(novoJogo);
  await salvarJSON(PATH_JOGOS, jogos);
  res.status(201).json(novoJogo);
});

router.post("/jogos/:id/placar", exigirPermissaoAdmin, async (req, res) => {
  const jogos = await lerJSON(PATH_JOGOS, []);
  const idx = jogos.findIndex(
    (jogo) => String(jogo.id) === String(req.params.id),
  );
  if (idx === -1) return res.status(404).json({ erro: "Jogo nao encontrado." });
  jogos[idx].placarMandante =
    req.body.placarMandante === "" ? null : Number(req.body.placarMandante);
  jogos[idx].placarVisitante =
    req.body.placarVisitante === "" ? null : Number(req.body.placarVisitante);
  await salvarJSON(PATH_JOGOS, jogos);
  res.json(jogos[idx]);
});

router.put("/jogos/:id", exigirPermissaoAdmin, async (req, res) => {
  const jogos = await lerJSON(PATH_JOGOS, []);
  const idx = jogos.findIndex(
    (jogo) => String(jogo.id) === String(req.params.id),
  );
  if (idx === -1) return res.status(404).json({ erro: "Jogo nao encontrado." });

  const mandanteAtualizado = req.body.mandante || jogos[idx].mandante;
  const visitanteAtualizado = req.body.visitante || jogos[idx].visitante;

  jogos[idx] = {
    ...jogos[idx],
    campeonato: req.body.campeonato || jogos[idx].campeonato,
    dataHora: req.body.dataHora || jogos[idx].dataHora,
    mandante: mandanteAtualizado,
    visitante: visitanteAtualizado,
    escudoMandante: req.body.escudoMandante || obterEscudo(mandanteAtualizado),
    escudoVisitante:
      req.body.escudoVisitante || obterEscudo(visitanteAtualizado),
    placarMandante:
      req.body.placarMandante === ""
        ? null
        : Number(req.body.placarMandante ?? jogos[idx].placarMandante),
    placarVisitante:
      req.body.placarVisitante === ""
        ? null
        : Number(req.body.placarVisitante ?? jogos[idx].placarVisitante),
  };
  await salvarJSON(PATH_JOGOS, jogos);
  res.json(jogos[idx]);
});

router.delete("/jogos/:id", exigirPermissaoAdmin, async (req, res) => {
  const jogos = await lerJSON(PATH_JOGOS, []);
  await salvarJSON(
    PATH_JOGOS,
    jogos.filter((jogo) => String(jogo.id) !== String(req.params.id)),
  );
  res.json({ mensagem: "Jogo excluido." });
});

// ==========================================
// ELENCO E ESCALAÇÃO (CAMPO TÁTICO)
// ==========================================

router.get("/elenco", async (req, res) => {
  const elenco = await lerJSON(PATH_ELENCO, []);
  res.json(elenco);
});

router.post("/elenco/sincronizar", async (req, res) => {
  try {
    const { GoogleGenAI } = require("@google/genai");
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
      throw new Error("A chave GEMINI_API_KEY não foi encontrada no .env.");

    const ai = new GoogleGenAI({ apiKey });
    const baseAtual = await lerJSON(PATH_ELENCO, []);

    // Passa os nomes para o Gemini entender quem está no elenco do usuário
    let nomesContexto = baseAtual
      .slice(0, 30)
      .map((j) => j.nome)
      .join(", ");
    if (!nomesContexto || baseAtual.length < 11) {
      nomesContexto =
        "L. Linck, Neto, Raúl, Vitinho, A. Barboza, A. Telles, M. Ponte, Bastos, Marçal, N. Ferraresi, D. Oliveira, Á. Montoro, Newton, S. Rodríguez, Allan, M. Freitas, C. Medina, A. Cabral, M. Martins, J. Savarino, J. Correa, J. Santos, C. Ramos";
    }

    const prompt = `Você é um analista de dados. Gere um array JSON estrito com as estatísticas do elenco do Botafogo para a temporada de 2026 (janeiro a maio). Avalie os seguintes jogadores: ${nomesContexto}.
    
    Regras Inquebráveis:
    1. Responda APENAS com o código JSON. Sem marcação markdown, sem crases, sem texto adicional.
    2. O JSON deve ser um array de objetos, e cada objeto DEVE ter este formato:
    {
      "id": "gerar_um_id_numerico_como_string",
      "numero": "numero_de_camisa_realista",
      "nome": "Nome do Jogador",
      "posicao": "G", "D", "M" ou "F",
      "jogos": numero_realista_entre_5_e_30,
      "gols": numero_realista,
      "assistencias": numero_realista,
      "foto": "https://api.sofascore.app/api/v1/player/114949/image"
    }
    3. Distribua os gols de forma realista (A. Cabral e atacantes com mais gols, defensores com poucos).`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    // Limpa qualquer lixo que a IA possa tentar colocar em volta do JSON
    let textoLimpo = (response.text || "")
      .replace(/^```[a-z]*\s*/i, "")
      .replace(/```$/i, "")
      .trim();
    const elencoGerado = JSON.parse(textoLimpo);

    // Restaura as fotos caso elas existissem na base de dados antiga
    elencoGerado.forEach((novo) => {
      const antigo = baseAtual.find(
        (b) => b.nome.includes(novo.nome) || novo.nome.includes(b.nome),
      );
      if (antigo && antigo.foto && !antigo.foto.includes("114949"))
        novo.foto = antigo.foto;
    });

    await salvarJSON(PATH_ELENCO, elencoGerado);
    res.json(elencoGerado);
  } catch (error) {
    console.error("[Gemini AI Error]", error);
    res.status(500).json({ erro: error.message });
  }
});

// ==========================================
// ROTA BLINDADA DO PROJETO ESTATÍSTICAS 4
// ==========================================
router.get("/elenco-2026", (req, res) => {
  const ELENCO_PERFEITO_2026 = [
    // Goleiros
    {
      id: "114949",
      numero: "12",
      nome: "John",
      posicao: "G",
      jogos: 28,
      gols: 0,
      assistencias: 1,
      foto: "https://api.sofascore.app/api/v1/player/114949/image",
    },
    {
      id: "10173",
      numero: "1",
      nome: "Gatito Fernández",
      posicao: "G",
      jogos: 12,
      gols: 0,
      assistencias: 0,
      foto: "https://api.sofascore.app/api/v1/player/10173/image",
    },
    {
      id: "1119887",
      numero: "24",
      nome: "L. Linck",
      posicao: "G",
      jogos: 18,
      gols: 0,
      assistencias: 0,
      foto: "https://api.sofascore.app/api/v1/player/1119887/image",
    },

    // Defensores
    {
      id: "26071",
      numero: "15",
      nome: "Bastos",
      posicao: "D",
      jogos: 26,
      gols: 4,
      assistencias: 0,
      foto: "https://api.sofascore.app/api/v1/player/26071/image",
    },
    {
      id: "801044",
      numero: "20",
      nome: "A. Barboza",
      posicao: "D",
      jogos: 26,
      gols: 1,
      assistencias: 1,
      foto: "https://api.sofascore.app/api/v1/player/801044/image",
    },
    {
      id: "914477",
      numero: "2",
      nome: "Vitinho",
      posicao: "D",
      jogos: 23,
      gols: 1,
      assistencias: 3,
      foto: "https://api.sofascore.app/api/v1/player/914477/image",
    },
    {
      id: "312110",
      numero: "13",
      nome: "Alex Telles",
      posicao: "D",
      jogos: 20,
      gols: 0,
      assistencias: 4,
      foto: "https://api.sofascore.app/api/v1/player/312110/image",
    },
    {
      id: "1099163",
      numero: "4",
      nome: "Mateo Ponte",
      posicao: "D",
      jogos: 18,
      gols: 2,
      assistencias: 2,
      foto: "https://api.sofascore.app/api/v1/player/1099163/image",
    },
    {
      id: "143593",
      numero: "21",
      nome: "Marçal",
      posicao: "D",
      jogos: 12,
      gols: 0,
      assistencias: 1,
      foto: "https://api.sofascore.app/api/v1/player/143593/image",
    },
    {
      id: "881215",
      numero: "5",
      nome: "N. Ferraresi",
      posicao: "D",
      jogos: 15,
      gols: 1,
      assistencias: 0,
      foto: "https://api.sofascore.app/api/v1/player/881215/image",
    },

    // Meio-campistas
    {
      id: "840202",
      numero: "17",
      nome: "Marlon Freitas",
      posicao: "M",
      jogos: 27,
      gols: 5,
      assistencias: 7,
      foto: "https://api.sofascore.app/api/v1/player/840202/image",
    },
    {
      id: "10129",
      numero: "26",
      nome: "Gregore",
      posicao: "M",
      jogos: 25,
      gols: 1,
      assistencias: 2,
      foto: "https://api.sofascore.app/api/v1/player/10129/image",
    },
    {
      id: "114973",
      numero: "8",
      nome: "Danilo",
      posicao: "M",
      jogos: 24,
      gols: 10,
      assistencias: 3,
      foto: "https://api.sofascore.app/api/v1/player/114973/image",
    },
    {
      id: "135086",
      numero: "23",
      nome: "Thiago Almada",
      posicao: "M",
      jogos: 22,
      gols: 6,
      assistencias: 6,
      foto: "https://api.sofascore.app/api/v1/player/135086/image",
    },
    {
      id: "114972",
      numero: "33",
      nome: "Eduardo",
      posicao: "M",
      jogos: 18,
      gols: 4,
      assistencias: 2,
      foto: "https://api.sofascore.app/api/v1/player/114972/image",
    },
    {
      id: "1650770",
      numero: "10",
      nome: "Á. Montoro",
      posicao: "M",
      jogos: 20,
      gols: 3,
      assistencias: 5,
      foto: "https://api.sofascore.app/api/v1/player/1650770/image",
    },

    // Atacantes
    {
      id: "870762",
      numero: "19",
      nome: "Arthur Cabral",
      posicao: "F",
      jogos: 21,
      gols: 5,
      assistencias: 2,
      foto: "https://api.sofascore.app/api/v1/player/870762/image",
    },
    {
      id: "137699",
      numero: "99",
      nome: "Igor Jesus",
      posicao: "F",
      jogos: 22,
      gols: 14,
      assistencias: 3,
      foto: "https://api.sofascore.app/api/v1/player/137699/image",
    },
    {
      id: "145892",
      numero: "7",
      nome: "Luiz Henrique",
      posicao: "F",
      jogos: 24,
      gols: 12,
      assistencias: 8,
      foto: "https://api.sofascore.app/api/v1/player/145892/image",
    },
    {
      id: "10398",
      numero: "10",
      nome: "Savarino",
      posicao: "F",
      jogos: 24,
      gols: 11,
      assistencias: 10,
      foto: "https://api.sofascore.app/api/v1/player/10398/image",
    },
    {
      id: "121025",
      numero: "11",
      nome: "Júnior Santos",
      posicao: "F",
      jogos: 15,
      gols: 4,
      assistencias: 1,
      foto: "https://api.sofascore.app/api/v1/player/121025/image",
    },
    {
      id: "11528",
      numero: "9",
      nome: "Tiquinho Soares",
      posicao: "F",
      jogos: 20,
      gols: 6,
      assistencias: 4,
      foto: "https://api.sofascore.app/api/v1/player/11528/image",
    },
    {
      id: "914819",
      numero: "18",
      nome: "Chris Ramos",
      posicao: "F",
      jogos: 12,
      gols: 2,
      assistencias: 0,
      foto: "https://api.sofascore.app/api/v1/player/914819/image",
    },
  ];
  res.json(ELENCO_PERFEITO_2026);
});

module.exports = router;

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
} = require("../services/sportsService");

const PATH_TABELAS = path.join(__dirname, "../../data/tabelas.json");
const PATH_JOGOS = path.join(__dirname, "../../data/jogos.json");
const PATH_CONFIG = path.join(__dirname, "../../data/config.json");

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

  const oddsFinal = [...oddsDestaque, ...oddsRestante].map((odd, index) => ({
    ...odd,
    destaque: index === 0 && oddsDestaque.length > 0,
  }));

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

module.exports = router;

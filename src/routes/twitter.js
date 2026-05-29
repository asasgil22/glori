const express = require("express");
const router = express.Router();
const path = require("path");
const { lerJSON, salvarJSON } = require("../config/database");
const { exigirPermissaoAdmin } = require("../middlewares/auth");
const {
  atualizarCacheTwitter,
  getCacheTwitter,
} = require("../services/twitterService");

const PATH_TWITTER = path.join(__dirname, "../../data/twitter.json");

function normalizarBoolean(valor) {
  return valor === true || valor === "true" || valor === "on" || valor === "1";
}

router.get("/twitter", async (req, res) => res.json(getCacheTwitter()));

router.get("/twitter-gerenciador", async (req, res) =>
  res.json(await lerJSON(PATH_TWITTER, [])),
);

router.post("/twitter-gerenciador", exigirPermissaoAdmin, async (req, res) => {
  const criadores = await lerJSON(PATH_TWITTER, []);
  const novo = {
    id: Date.now().toString(),
    nome: req.body.nome || "",
    handle: req.body.handle || "",
    avatarUrl: req.body.avatarUrl || "",
    ativo: req.body.ativo !== false,
  };
  criadores.push(novo);
  await salvarJSON(PATH_TWITTER, criadores);
  atualizarCacheTwitter();
  res.status(201).json(novo);
});

router.put(
  "/twitter-gerenciador/:id",
  exigirPermissaoAdmin,
  async (req, res) => {
    const criadores = await lerJSON(PATH_TWITTER, []);
    const idx = criadores.findIndex(
      (c) => String(c.id) === String(req.params.id),
    );
    if (idx === -1)
      return res.status(404).json({ erro: "Perfil não encontrado." });
    criadores[idx] = {
      ...criadores[idx],
      nome: req.body.nome || criadores[idx].nome,
      handle: req.body.handle || criadores[idx].handle,
      avatarUrl: req.body.avatarUrl ?? criadores[idx].avatarUrl,
      ativo: normalizarBoolean(req.body.ativo),
    };
    await salvarJSON(PATH_TWITTER, criadores);
    atualizarCacheTwitter();
    res.json(criadores[idx]);
  },
);

router.delete(
  "/twitter-gerenciador/:id",
  exigirPermissaoAdmin,
  async (req, res) => {
    const criadores = await lerJSON(PATH_TWITTER, []);
    await salvarJSON(
      PATH_TWITTER,
      criadores.filter((c) => String(c.id) !== String(req.params.id)),
    );
    atualizarCacheTwitter();
    res.json({ mensagem: "Perfil excluído." });
  },
);

module.exports = router;

const express = require("express");
const router = express.Router();
const path = require("path");
const { lerJSON, salvarJSON } = require("../config/database");
const { estaLogado, exigirPermissaoAdmin } = require("../middlewares/auth");

const PATH_COMENTARIOS = path.join(__dirname, "../../data/comentarios.json");

// Escudo de Moderação: Dicionário Base de Palavras Impróprias (Você pode expandir depois)
const PALAVROES = [
  "porra",
  "caralho",
  "buceta",
  "viado",
  "puta",
  "fdp",
  "arrombado",
  "cu",
  "merda",
  "pqp",
];

// Bloqueador Absoluto de Links (A Trava Anti-Pornografia e Anti-Spam)
const LINK_REGEX = /(http:\/\/|https:\/\/|www\.|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})/i;

// Armazena o tempo do último comentário de cada usuário na memória RAM
const rateLimits = {};

// Rota Pública: Listar comentários de uma matéria
router.get("/noticia/:noticiaId", async (req, res) => {
  const comentarios = await lerJSON(PATH_COMENTARIOS, []);
  const filtrados = comentarios
    .filter((c) => c.noticiaId === req.params.noticiaId)
    .slice(-50);
  res.json(filtrados);
});

// Rota Protegida: Enviar Comentário
router.post("/noticia/:noticiaId", async (req, res) => {
  if (!estaLogado(req))
    return res.status(401).json({ erro: "Faça login para comentar." });

  const userId = req.session.user.id;
  const now = Date.now();

  // Trava Metralhadora: Exige 60s entre um comentário e outro
  if (rateLimits[userId] && now - rateLimits[userId] < 60000) {
    return res.status(429).json({
      erro: "Aguarde 1 minuto antes de enviar outro comentário para evitar spam.",
    });
  }

  let texto = req.body.texto || "";
  texto = texto.trim();

  if (!texto)
    return res.status(400).json({ erro: "O comentário não pode ser vazio." });
  if (texto.length > 500)
    return res
      .status(400)
      .json({ erro: "Seu comentário excedeu o limite de 500 caracteres." });

  if (LINK_REGEX.test(texto))
    return res
      .status(400)
      .json({ erro: "Links não são permitidos por medidas de segurança." });

  const hasBadWord = PALAVROES.some((word) =>
    texto.toLowerCase().includes(word),
  );
  if (hasBadWord)
    return res.status(400).json({
      erro: "Seu comentário contém palavras impróprias que violam as regras da comunidade.",
    });

  rateLimits[userId] = now;

  const comentarios = await lerJSON(PATH_COMENTARIOS, []);
  const novo = {
    id: Date.now().toString(),
    noticiaId: req.params.noticiaId,
    usuarioId: userId,
    usuarioNome: req.session.user.usuario,
    role: req.session.user.role,
    texto: texto,
    data: new Date().toISOString(),
    likes: [],
  };

  comentarios.push(novo);
  if (comentarios.length > 5000) comentarios.shift(); // O Render agradece: nunca passa de 5.000 mensagens no servidor para poupar RAM

  await salvarJSON(PATH_COMENTARIOS, comentarios);
  res.status(201).json(novo);
});

// Rota Protegida: Curtir/Descurtir Comentário
router.post("/like/:id", async (req, res) => {
  if (!estaLogado(req))
    return res.status(401).json({ erro: "Faça login para curtir." });

  const userId = req.session.user.id;
  const comentarios = await lerJSON(PATH_COMENTARIOS, []);
  const idx = comentarios.findIndex(
    (c) => String(c.id) === String(req.params.id),
  );

  if (idx === -1)
    return res.status(404).json({ erro: "Comentário não encontrado." });
  if (!comentarios[idx].likes) comentarios[idx].likes = [];

  const likeIdx = comentarios[idx].likes.indexOf(userId);
  if (likeIdx === -1)
    comentarios[idx].likes.push(userId); // Curtiu
  else comentarios[idx].likes.splice(likeIdx, 1); // Descurtiu

  await salvarJSON(PATH_COMENTARIOS, comentarios);
  res.json({ likes: comentarios[idx].likes.length });
});

// Rotas do Painel Administrativo
router.get("/", exigirPermissaoAdmin, async (req, res) => {
  const comentarios = await lerJSON(PATH_COMENTARIOS, []);
  res.json(comentarios.slice(-100).reverse());
});
router.delete("/:id", exigirPermissaoAdmin, async (req, res) => {
  let comentarios = await lerJSON(PATH_COMENTARIOS, []);
  comentarios = comentarios.filter(
    (c) => String(c.id) !== String(req.params.id),
  );
  await salvarJSON(PATH_COMENTARIOS, comentarios);
  res.json({ mensagem: "Comentário excluído." });
});
module.exports = router;

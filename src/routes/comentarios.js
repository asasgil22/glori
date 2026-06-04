const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;
const { GoogleGenAI } = require("@google/genai");
const { exigirLoginAPI, exigirPermissaoAdmin } = require("../middlewares/auth");
const { lerJSON, salvarJSON } = require("../config/database");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const PATH_COMENTARIOS = path.join(__dirname, "../../data", "comentarios.json");
const PATH_NOTIFICACOES = path.join(
  __dirname,
  "../../data",
  "notificacoes.json",
);

// SSE Clients (WebSockets Nativos HTTP)
const clientesSSE = {};
const typingUsers = {};

function getTypingCount(noticiaId) {
  if (!typingUsers[noticiaId]) return 0;
  const now = Date.now();
  let count = 0;
  for (const uid in typingUsers[noticiaId]) {
    if (now - typingUsers[noticiaId][uid] < 5000) count++;
    else delete typingUsers[noticiaId][uid];
  }
  return count;
}

function notificarClientes(noticiaId) {
  if (clientesSSE[noticiaId]) {
    clientesSSE[noticiaId].forEach((cliente) => {
      cliente.res.write(`data: ${JSON.stringify({ tipo: "atualizacao" })}\n\n`);
    });
  }
}

function notificarTyping(noticiaId) {
  const count = getTypingCount(noticiaId);
  if (clientesSSE[noticiaId]) {
    clientesSSE[noticiaId].forEach((cliente) => {
      cliente.res.write(
        `data: ${JSON.stringify({ tipo: "typing", count })}\n\n`,
      );
    });
  }
}

// Endpoint Realtime: Mantém o navegador "ouvindo" ativamente o servidor
router.get("/stream/:noticiaId", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const noticiaId = req.params.noticiaId;
  if (!clientesSSE[noticiaId]) clientesSSE[noticiaId] = [];

  const cliente = { res };
  clientesSSE[noticiaId].push(cliente);

  req.on("close", () => {
    clientesSSE[noticiaId] = clientesSSE[noticiaId].filter(
      (c) => c !== cliente,
    );
  });
});

router.post("/typing/:noticiaId", exigirLoginAPI, (req, res) => {
  const noticiaId = req.params.noticiaId;
  const userId = req.session.user.id;
  if (!typingUsers[noticiaId]) typingUsers[noticiaId] = {};
  typingUsers[noticiaId][userId] = Date.now();
  notificarTyping(noticiaId);
  res.sendStatus(200);
});

router.get("/noticia/:noticiaId", async (req, res) => {
  const comentarios = await lerJSON(PATH_COMENTARIOS, []);
  const filtrados = comentarios.filter(
    (c) => String(c.noticiaId) === String(req.params.noticiaId),
  );

  // Calcula Gamificação (Total de comentários por usuário)
  const contagemUsuarios = {};
  comentarios.forEach((c) => {
    contagemUsuarios[c.usuarioId] = (contagemUsuarios[c.usuarioId] || 0) + 1;
  });

  const enriquecidos = filtrados.map((c) => {
    const total = contagemUsuarios[c.usuarioId] || 0;
    let badgeGamificacao = "";
    if (total >= 10) badgeGamificacao = "Embaixador 🏆";
    else if (total >= 3) badgeGamificacao = "Assíduo 🏅";

    return { ...c, badgeGamificacao };
  });

  res.json(enriquecidos);
});

router.get("/notificacoes", exigirLoginAPI, async (req, res) => {
  const notificacoes = await lerJSON(PATH_NOTIFICACOES, []);
  const minhas = notificacoes
    .filter((n) => String(n.usuarioDestino) === String(req.session.user.id))
    .sort((a, b) => new Date(b.data) - new Date(a.data));
  res.json(minhas.slice(0, 20));
});

router.post("/notificacoes/ler", exigirLoginAPI, async (req, res) => {
  const notificacoes = await lerJSON(PATH_NOTIFICACOES, []);
  let alterado = false;
  notificacoes.forEach((n) => {
    if (String(n.usuarioDestino) === String(req.session.user.id) && !n.lida) {
      n.lida = true;
      alterado = true;
    }
  });
  if (alterado) await salvarJSON(PATH_NOTIFICACOES, notificacoes);
  res.json({ sucesso: true });
});

router.post("/noticia/:noticiaId", exigirLoginAPI, async (req, res) => {
  const { texto, parentId, gifUrl } = req.body;
  if ((!texto || !texto.trim()) && !gifUrl)
    return res.status(400).json({ erro: "Conteúdo vazio." });

  try {
    // Moderação e Sentimento com IA
    let sentimento = "Neutro";
    if (texto && texto.trim()) {
      try {
        const prompt = `Analise o seguinte comentário de um torcedor do Botafogo para o portal GloriosoNet. 
        Responda EXATAMENTE com um JSON: {"ofensivo": boolean, "sentimento": "Otimista" | "Pessimista" | "Neutro"}.
        O campo "ofensivo" só deve ser true se contiver insultos graves, xingamentos pesados ou racismo/preconceito.
        Comentário: "${texto}"`;

        const response = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });

        const analise = JSON.parse(response.text);
        if (analise.ofensivo) {
          return res.status(400).json({
            erro: "Comentário bloqueado. Por favor, mantenha o respeito nos debates.",
          });
        }
        sentimento = analise.sentimento || "Neutro";
      } catch (e) {
        console.error("[Moderação IA] Erro ao classificar:", e.message);
      }
    }

    const comentarios = await lerJSON(PATH_COMENTARIOS, []);

    const novoComentario = {
      id: Date.now().toString(),
      noticiaId: req.params.noticiaId,
      usuarioId: req.session.user.id,
      usuarioNome: req.session.user.usuario,
      avatarUrl: req.session.user.avatarUrl || "",
      role: req.session.user.role || "usuario",
      texto: texto ? texto.trim() : "",
      gifUrl: gifUrl || "",
      data: new Date().toISOString(),
      likes: [],
      reactions: {},
      parentId: parentId || null,
      sentimento: sentimento,
      fixado: false,
      editado: false,
      denuncias: [],
      oculto: false,
    };

    if (Array.isArray(comentarios)) {
      comentarios.push(novoComentario);
      await salvarJSON(PATH_COMENTARIOS, comentarios);
    }

    if (parentId) {
      const pai = comentarios.find((c) => String(c.id) === String(parentId));
      if (pai && pai.usuarioId !== req.session.user.id) {
        const notificacoes = await lerJSON(PATH_NOTIFICACOES, []);
        notificacoes.push({
          id: Date.now().toString(),
          usuarioDestino: pai.usuarioId,
          mensagem: `${req.session.user.usuario} respondeu ao seu comentário.`,
          link: `/noticia/${req.params.noticiaId}#comment-${novoComentario.id}`,
          lida: false,
          data: new Date().toISOString(),
        });
        if (notificacoes.length > 500) notificacoes.shift();
        await salvarJSON(PATH_NOTIFICACOES, notificacoes);
      }
    }

    try {
      notificarClientes(req.params.noticiaId);
    } catch (e) {}

    res.status(201).json(novoComentario);
  } catch (err) {
    console.error("Erro no servidor ao salvar comentário:", err);
    res
      .status(500)
      .json({ erro: "Erro interno no servidor ao registrar mensagem." });
  }
});

router.post("/react/:id", exigirLoginAPI, async (req, res) => {
  const { emoji } = req.body;
  const comentarios = await lerJSON(PATH_COMENTARIOS, []);
  const idx = comentarios.findIndex(
    (c) => String(c.id) === String(req.params.id),
  );
  if (idx === -1) return res.status(404).json({ erro: "Não encontrado." });

  const userId = req.session.user.id;
  if (!comentarios[idx].reactions) comentarios[idx].reactions = {};
  if (!comentarios[idx].reactions[emoji])
    comentarios[idx].reactions[emoji] = [];

  const userIdx = comentarios[idx].reactions[emoji].indexOf(userId);
  if (userIdx === -1) {
    comentarios[idx].reactions[emoji].push(userId);
    if (comentarios[idx].usuarioId !== userId) {
      const notificacoes = await lerJSON(PATH_NOTIFICACOES, []);
      notificacoes.push({
        id: Date.now().toString(),
        usuarioDestino: comentarios[idx].usuarioId,
        mensagem: `${req.session.user.usuario} reagiu com ${emoji} ao seu comentário.`,
        link: `/noticia/${comentarios[idx].noticiaId}#comment-${comentarios[idx].id}`,
        lida: false,
        data: new Date().toISOString(),
      });
      if (notificacoes.length > 500) notificacoes.shift();
      await salvarJSON(PATH_NOTIFICACOES, notificacoes);
    }
  } else comentarios[idx].reactions[emoji].splice(userIdx, 1);

  await salvarJSON(PATH_COMENTARIOS, comentarios);
  notificarClientes(comentarios[idx].noticiaId);
  res.json({ sucesso: true });
});

router.post("/like/:id", exigirLoginAPI, async (req, res) => {
  const comentarios = await lerJSON(PATH_COMENTARIOS, []);
  const idx = comentarios.findIndex(
    (c) => String(c.id) === String(req.params.id),
  );
  if (idx === -1) return res.status(404).json({ erro: "Não encontrado." });

  const userId = req.session.user.id;
  if (!comentarios[idx].likes) comentarios[idx].likes = [];

  const userIdx = comentarios[idx].likes.indexOf(userId);
  if (userIdx === -1) comentarios[idx].likes.push(userId);
  else comentarios[idx].likes.splice(userIdx, 1);

  await salvarJSON(PATH_COMENTARIOS, comentarios);
  notificarClientes(comentarios[idx].noticiaId);
  res.json({ sucesso: true });
});

router.put("/meu/:id", exigirLoginAPI, async (req, res) => {
  const { texto } = req.body;
  const comentarios = await lerJSON(PATH_COMENTARIOS, []);
  const c = comentarios.find((x) => String(x.id) === String(req.params.id));
  if (!c) return res.status(404).json({ erro: "Não encontrado." });
  if (c.usuarioId !== req.session.user.id)
    return res.status(403).json({ erro: "Não autorizado." });
  if (Date.now() - new Date(c.data).getTime() > 5 * 60 * 1000) {
    return res
      .status(400)
      .json({ erro: "O tempo limite de 5 minutos para edição expirou." });
  }

  c.texto = texto.trim();
  c.editado = true;
  await salvarJSON(PATH_COMENTARIOS, comentarios);
  notificarClientes(c.noticiaId);
  res.json(c);
});

router.post("/report/:id", exigirLoginAPI, async (req, res) => {
  const comentarios = await lerJSON(PATH_COMENTARIOS, []);
  const c = comentarios.find((x) => String(x.id) === String(req.params.id));
  if (!c) return res.status(404).json({ erro: "Não encontrado." });

  if (!c.denuncias) c.denuncias = [];
  if (!c.denuncias.includes(req.session.user.id)) {
    c.denuncias.push(req.session.user.id);
    if (c.denuncias.length >= 3) c.oculto = true;
    await salvarJSON(PATH_COMENTARIOS, comentarios);
    notificarClientes(c.noticiaId);
  }
  res.json({ sucesso: true });
});

router.get("/", exigirPermissaoAdmin, async (req, res) => {
  try {
    const comentarios = await lerJSON(PATH_COMENTARIOS, []);
    comentarios.sort((a, b) => new Date(b.data) - new Date(a.data));
    res.json(comentarios);
  } catch (e) {
    res.status(500).json({ erro: "Erro ao buscar comentários." });
  }
});

router.delete("/:id", exigirPermissaoAdmin, async (req, res) => {
  try {
    const comentarios = await lerJSON(PATH_COMENTARIOS, []);
    const filtrados = comentarios.filter(
      (c) => String(c.id) !== String(req.params.id),
    );
    await salvarJSON(PATH_COMENTARIOS, filtrados);
    res.json({ sucesso: true });
  } catch (e) {
    res.status(500).json({ erro: "Erro ao excluir comentário." });
  }
});

router.delete("/meu/:id", exigirLoginAPI, async (req, res) => {
  try {
    const comentarios = await lerJSON(PATH_COMENTARIOS, []);
    const c = comentarios.find((x) => String(x.id) === String(req.params.id));
    if (!c) return res.status(404).json({ erro: "Não encontrado." });
    if (c.usuarioId !== req.session.user.id)
      return res.status(403).json({ erro: "Não autorizado." });

    const filtrados = comentarios.filter(
      (x) => String(x.id) !== String(req.params.id),
    );
    await salvarJSON(PATH_COMENTARIOS, filtrados);
    notificarClientes(c.noticiaId);
    res.json({ sucesso: true });
  } catch (e) {
    res.status(500).json({ erro: "Erro ao apagar." });
  }
});

router.post("/fixar/:id", exigirPermissaoAdmin, async (req, res) => {
  try {
    const comentarios = await lerJSON(PATH_COMENTARIOS, []);
    const idx = comentarios.findIndex(
      (c) => String(c.id) === String(req.params.id),
    );
    if (idx === -1) return res.status(404).json({ erro: "Não encontrado." });

    const noticiaId = comentarios[idx].noticiaId;

    if (!comentarios[idx].fixado) {
      comentarios.forEach((c) => {
        if (c.noticiaId === noticiaId) c.fixado = false;
      });
    }

    comentarios[idx].fixado = !comentarios[idx].fixado;
    await salvarJSON(PATH_COMENTARIOS, comentarios);
    notificarClientes(noticiaId);
    res.json({ sucesso: true });
  } catch (e) {
    res.status(500).json({ erro: "Erro ao fixar comentário." });
  }
});

module.exports = router;

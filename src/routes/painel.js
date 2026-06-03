const express = require("express");
const router = express.Router();
const path = require("path");
const { lerJSON, salvarJSON } = require("../config/database");
const { exigirPermissaoAdmin } = require("../middlewares/auth");
const { upload, uploadParaSupabase } = require("../middlewares/upload");
const {
  fetchLatestVideos,
  getVideoCache,
  setVideoCache,
  getLastFetchTime,
  setLastFetchTime,
  CACHE_DURATION,
} = require("../services/youtubeService");

const PATH_PATROCINADORES = path.join(
  __dirname,
  "../../data/patrocinadores.json",
);
const PATH_AUTORES = path.join(__dirname, "../../data/autores.json");
const PATH_VIDEOS = path.join(__dirname, "../../data/videos.json");
const PATH_CONFIG = path.join(__dirname, "../../data/config.json");
const PATH_NOTICIAS = path.join(__dirname, "../../data/noticias.json");
const PATH_ESTATISTICAS = path.join(__dirname, "../../data/estatisticas.json");
const PATH_PROGRAMACAO = path.join(__dirname, "../../data/programacao.json");

function normalizarBoolean(valor) {
  return valor === true || valor === "true" || valor === "on" || valor === "1";
}

// ==========================================
// SISTEMA DE PATROCINADORES
// ==========================================
router.get("/patrocinadores", async (req, res) => {
  const patrocinadores = await lerJSON(PATH_PATROCINADORES, []);
  const base =
    req.query.admin === "true"
      ? patrocinadores
      : patrocinadores.filter((p) => p.ativo !== false);
  res.json(
    [...base].sort(
      (a, b) =>
        new Date(b.data || 0).getTime() - new Date(a.data || 0).getTime(),
    ),
  );
});

router.post(
  "/patrocinadores",
  exigirPermissaoAdmin,
  upload.single("imagem"),
  async (req, res) => {
    const patrocinadores = await lerJSON(PATH_PATROCINADORES, []);
    const novo = {
      id: Date.now().toString(),
      nome: req.body.nome || "Patrocinador",
      tipo: req.body.tipo || "texto",
      localExibicao: req.body.localExibicao || "ambos",
      dataInicio: req.body.dataInicio || "",
      dataFim: req.body.dataFim || "",
      imagemUrl: req.file ? await uploadParaSupabase(req.file) : "",
      link: req.body.link || "",
      ativo: normalizarBoolean(req.body.ativo),
      data: new Date().toISOString(),
    };
    patrocinadores.unshift(novo);
    await salvarJSON(PATH_PATROCINADORES, patrocinadores);
    res.status(201).json(novo);
  },
);

router.put(
  "/patrocinadores/:id",
  exigirPermissaoAdmin,
  upload.single("imagem"),
  async (req, res) => {
    const patrocinadores = await lerJSON(PATH_PATROCINADORES, []);
    const idx = patrocinadores.findIndex(
      (p) => String(p.id) === String(req.params.id),
    );
    if (idx === -1)
      return res.status(404).json({ erro: "Patrocinador não encontrado." });

    let imagemUrl = patrocinadores[idx].imagemUrl;
    if (normalizarBoolean(req.body.removerImagem)) {
      imagemUrl = "";
    } else if (req.file) {
      imagemUrl = await uploadParaSupabase(req.file);
    }

    patrocinadores[idx] = {
      ...patrocinadores[idx],
      nome: req.body.nome || patrocinadores[idx].nome,
      tipo: req.body.tipo || patrocinadores[idx].tipo,
      localExibicao:
        req.body.localExibicao || patrocinadores[idx].localExibicao || "ambos",
      dataInicio:
        req.body.dataInicio !== undefined
          ? req.body.dataInicio
          : patrocinadores[idx].dataInicio || "",
      dataFim:
        req.body.dataFim !== undefined
          ? req.body.dataFim
          : patrocinadores[idx].dataFim || "",
      imagemUrl,
      link: req.body.link ?? patrocinadores[idx].link ?? "",
      ativo:
        req.body.ativo === undefined
          ? patrocinadores[idx].ativo !== false
          : normalizarBoolean(req.body.ativo),
    };
    await salvarJSON(PATH_PATROCINADORES, patrocinadores);
    res.json(patrocinadores[idx]);
  },
);

router.delete("/patrocinadores/:id", exigirPermissaoAdmin, async (req, res) => {
  const patrocinadores = await lerJSON(PATH_PATROCINADORES, []);
  await salvarJSON(
    PATH_PATROCINADORES,
    patrocinadores.filter((p) => String(p.id) !== String(req.params.id)),
  );
  res.json({ mensagem: "Patrocinador excluido." });
});

// ==========================================
// SISTEMA DE AUTORES
// ==========================================
router.get("/autores", async (req, res) => {
  const autores = await lerJSON(PATH_AUTORES, []);
  const noticias = await lerJSON(PATH_NOTICIAS, []);
  const payload = autores.map((a) => {
    let totalArtigos = 0;
    let temNovaMateria = false;
    let dataUltimaMateria = 0;
    const limiteTempo = Date.now() - 24 * 60 * 60 * 1000;
    noticias.forEach((n) => {
      const autorNoticia = (n.autor || "Redacao").trim().toLowerCase();
      const autorCadastro = (a.nome || "").trim().toLowerCase();
      if (n.status !== "rascunho" && autorNoticia === autorCadastro) {
        totalArtigos++;
        const tempoNoticia = new Date(n.data).getTime();
        if (tempoNoticia > limiteTempo) temNovaMateria = true;
        if (tempoNoticia > dataUltimaMateria) dataUltimaMateria = tempoNoticia;
      }
    });
    return { ...a, totalArtigos, temNovaMateria, dataUltimaMateria };
  });
  res.json(payload);
});

router.post(
  "/autores",
  exigirPermissaoAdmin,
  upload.single("imagem"),
  async (req, res) => {
    const autores = await lerJSON(PATH_AUTORES, []);
    if (autores.length >= 12)
      return res.status(400).json({ erro: "Limite de 12 autores atingido." });
    const novo = {
      id: Date.now().toString(),
      nome: req.body.nome || "Autor",
      imagemUrl: req.file ? await uploadParaSupabase(req.file) : "",
      verificado: normalizarBoolean(req.body.verificado),
      redes: req.body.redes || "",
      arroba: req.body.arroba || "",
    };
    autores.push(novo);
    await salvarJSON(PATH_AUTORES, autores);
    res.status(201).json(novo);
  },
);

router.put(
  "/autores/:id",
  exigirPermissaoAdmin,
  upload.single("imagem"),
  async (req, res) => {
    const autores = await lerJSON(PATH_AUTORES, []);
    const idx = autores.findIndex(
      (a) => String(a.id) === String(req.params.id),
    );
    if (idx === -1)
      return res.status(404).json({ erro: "Autor não encontrado." });

    let imagemUrl = autores[idx].imagemUrl;
    if (normalizarBoolean(req.body.removerImagem)) {
      imagemUrl = "";
    } else if (req.file) {
      imagemUrl = await uploadParaSupabase(req.file);
    }

    autores[idx] = {
      ...autores[idx],
      nome: req.body.nome || autores[idx].nome,
      imagemUrl,
      verificado:
        req.body.verificado === undefined
          ? autores[idx].verificado
          : normalizarBoolean(req.body.verificado),
      redes:
        req.body.redes !== undefined
          ? req.body.redes
          : autores[idx].redes || "",
      arroba:
        req.body.arroba !== undefined
          ? req.body.arroba
          : autores[idx].arroba || "",
    };
    await salvarJSON(PATH_AUTORES, autores);
    res.json(autores[idx]);
  },
);

router.put("/autores/reorder", exigirPermissaoAdmin, async (req, res) => {
  try {
    const { ids } = req.body;
    const autores = await lerJSON(PATH_AUTORES, []);
    const reordenados = [];
    if (Array.isArray(ids)) {
      ids.forEach((id) => {
        const autor = autores.find((a) => String(a.id) === String(id));
        if (autor) reordenados.push(autor);
      });
      autores.forEach((a) => {
        if (!reordenados.some((r) => String(r.id) === String(a.id)))
          reordenados.push(a);
      });
      await salvarJSON(PATH_AUTORES, reordenados);
      res.json(reordenados);
    } else {
      res.status(400).json({ erro: "Formato de ordem inválido." });
    }
  } catch (error) {
    res.status(500).json({ erro: "Erro ao reordenar autores." });
  }
});

router.delete("/autores/:id", exigirPermissaoAdmin, async (req, res) => {
  const autores = await lerJSON(PATH_AUTORES, []);
  await salvarJSON(
    PATH_AUTORES,
    autores.filter((a) => String(a.id) !== String(req.params.id)),
  );
  res.json({ mensagem: "Autor excluído." });
});

// ==========================================
// SISTEMA DE PROGRAMAÇÃO (GRADE DE TV)
// ==========================================
const defaultProgramacao = [
  {
    dia: "Segunda",
    id: "segunda",
    eventos: [
      {
        horario: "08:00",
        canal: "tf",
        titulo: "Giro de Notícias",
        desc: "Atualizações do Botafogo.",
      },
      {
        horario: "10:00",
        canal: "setor",
        titulo: "Resenha Matinal",
        desc: "Debate.",
      },
      {
        horario: "12:00",
        canal: "tf",
        titulo: "Live do TF",
        desc: "Informações exclusivas.",
      },
      {
        horario: "14:00",
        canal: "arena",
        titulo: "Opinião Alvinegra",
        desc: "Análise.",
      },
      {
        horario: "20:00",
        canal: "tf",
        titulo: "Live Noturna",
        desc: "Fechamento do dia.",
      },
      {
        horario: "22:00",
        canal: "arena",
        titulo: "Arena Madrugada",
        desc: "A resenha.",
      },
    ],
  },
  {
    dia: "Terça",
    id: "terca",
    eventos: [
      {
        horario: "08:00",
        canal: "tf",
        titulo: "Giro de Notícias",
        desc: "As primeiras atualizações do dia.",
      },
      {
        horario: "11:30",
        canal: "setor",
        titulo: "Live do Setor Visitante",
        desc: "Análise e muito debate alvinegro.",
      },
      {
        horario: "12:30",
        canal: "arena",
        titulo: "Arena Alvinegra",
        desc: "Resenha e informações de momento.",
      },
      {
        horario: "12:30",
        canal: "tf",
        titulo: "Almoço com TF",
        desc: "Atualização e debate tático.",
      },
      {
        horario: "18:00",
        canal: "arena",
        titulo: "6 é Fogo",
        desc: "Debate no fim de tarde.",
      },
      {
        horario: "21:00",
        canal: "setor",
        titulo: "Live do Setor Visitante",
        desc: "Resenha noturna e interatividade.",
      },
    ],
  },
  {
    dia: "Quarta",
    id: "quarta",
    eventos: [
      {
        horario: "08:00",
        canal: "tf",
        titulo: "Giro de Notícias",
        desc: "As primeiras atualizações do dia.",
      },
      {
        horario: "11:30",
        canal: "setor",
        titulo: "Live do Setor Visitante",
        desc: "Análise e muito debate alvinegro.",
      },
      {
        horario: "12:30",
        canal: "arena",
        titulo: "Arena Alvinegra",
        desc: "Resenha e informações de momento.",
      },
      {
        horario: "12:30",
        canal: "tf",
        titulo: "Almoço com TF",
        desc: "Atualização e debate tático.",
      },
      {
        horario: "18:00",
        canal: "arena",
        titulo: "6 é Fogo",
        desc: "Debate no fim de tarde.",
      },
      {
        horario: "21:00",
        canal: "setor",
        titulo: "Live do Setor Visitante",
        desc: "Resenha noturna e interatividade.",
      },
    ],
  },
  {
    dia: "Quinta",
    id: "quinta",
    eventos: [
      {
        horario: "08:00",
        canal: "tf",
        titulo: "Giro de Notícias",
        desc: "As primeiras atualizações do dia.",
      },
      {
        horario: "11:30",
        canal: "setor",
        titulo: "Live do Setor Visitante",
        desc: "Análise e muito debate alvinegro.",
      },
      {
        horario: "12:30",
        canal: "arena",
        titulo: "Arena Alvinegra",
        desc: "Resenha e informações de momento.",
      },
      {
        horario: "12:30",
        canal: "tf",
        titulo: "Almoço com TF",
        desc: "Atualização e debate tático.",
      },
      {
        horario: "18:00",
        canal: "arena",
        titulo: "6 é Fogo",
        desc: "Debate no fim de tarde.",
      },
      {
        horario: "21:00",
        canal: "setor",
        titulo: "Live do Setor Visitante",
        desc: "Resenha noturna e interatividade.",
      },
    ],
  },
  {
    dia: "Sexta",
    id: "sexta",
    eventos: [
      {
        horario: "08:00",
        canal: "tf",
        titulo: "Giro de Notícias",
        desc: "As primeiras atualizações do dia.",
      },
      {
        horario: "11:30",
        canal: "setor",
        titulo: "Live do Setor Visitante",
        desc: "Análise e muito debate alvinegro.",
      },
      {
        horario: "12:30",
        canal: "arena",
        titulo: "Arena Alvinegra",
        desc: "Resenha e informações de momento.",
      },
      {
        horario: "12:30",
        canal: "tf",
        titulo: "Almoço com TF",
        desc: "Atualização e debate tático.",
      },
      {
        horario: "18:00",
        canal: "arena",
        titulo: "6 é Fogo",
        desc: "Debate no fim de tarde.",
      },
      {
        horario: "21:00",
        canal: "setor",
        titulo: "Live do Setor Visitante",
        desc: "Resenha noturna e interatividade.",
      },
    ],
  },
  {
    dia: "Sábado",
    id: "sabado",
    eventos: [
      {
        horario: "09:00",
        canal: "tf",
        titulo: "Boletim",
        desc: "O que esperar.",
      },
      {
        horario: "14:00",
        canal: "arena",
        titulo: "Arena Especial",
        desc: "Conteúdo focado na história.",
      },
      {
        horario: "18:00",
        canal: "setor",
        titulo: "Pré-jogo",
        desc: "Aquecimento.",
      },
    ],
  },
  {
    dia: "Domingo",
    id: "domingo",
    eventos: [
      {
        horario: "10:00",
        canal: "tf",
        titulo: "Manhã Alvinegra",
        desc: "Preparação.",
      },
      {
        horario: "14:00",
        canal: "setor",
        titulo: "Pré-jogo Oficial",
        desc: "A festa.",
      },
      {
        horario: "16:00",
        canal: "arena",
        titulo: "Narração Arena",
        desc: "O jogo.",
      },
      {
        horario: "18:00",
        canal: "tf",
        titulo: "Pós-Jogo Quente",
        desc: "A análise imediata.",
      },
    ],
  },
];

router.get("/programacao", async (req, res) => {
  const programacao = await lerJSON(PATH_PROGRAMACAO, defaultProgramacao);
  res.json(programacao);
});

router.put("/programacao", exigirPermissaoAdmin, async (req, res) => {
  try {
    await salvarJSON(PATH_PROGRAMACAO, req.body);
    res.json({ mensagem: "Programação atualizada com sucesso!" });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao salvar programação." });
  }
});

// ==========================================
// ROBÔ IA - DISPARO MANUAL
// ==========================================
router.post("/robo/run", exigirPermissaoAdmin, async (req, res) => {
  let roboIA;
  try {
    roboIA = require("../../robo-tf");
  } catch (e) {}
  if (roboIA && typeof roboIA.executarRoboTF === "function") {
    roboIA.executarRoboTF().catch(console.error);
    return res.json({ mensagem: "Varredura do Robô iniciada com sucesso!" });
  }
  res.status(503).json({ erro: "Robô offline ou não configurado." });
});

// ==========================================
// ESTATÍSTICAS DO DASHBOARD
// ==========================================
router.get("/estatisticas", exigirPermissaoAdmin, async (req, res) => {
  res.json(await lerJSON(PATH_ESTATISTICAS, { totais: {}, processados: [] }));
});

module.exports = router;

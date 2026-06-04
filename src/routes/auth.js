const express = require("express");
const router = express.Router();
const path = require("path");
const { lerJSON, salvarJSON } = require("../config/database");
const { estaLogado } = require("../middlewares/auth");
const { createClient } = require("@supabase/supabase-js");

const PATH_USUARIOS = path.join(__dirname, "../../data/usuarios.json");

// Rota para exportar apenas a URL pública do Supabase para o Frontend
router.get("/auth/config", (req, res) => {
  res.json({ supabaseUrl: process.env.SUPABASE_URL });
});

router.post("/login", async (req, res) => {
  const { usuario, senha } = req.body;
  const usuarios = await lerJSON(PATH_USUARIOS, []);
  const user = usuarios.find((u) => u.usuario === usuario && u.senha === senha);

  if (user) {
    req.session.logado = true;
    req.session.user = { id: user.id, usuario: user.usuario, role: user.role };
    return res.sendStatus(200);
  }
  res.status(401).json({ erro: "Usuario ou senha incorretos." });
});

// Rota de Login Social Super Protegida
router.post("/login/social", async (req, res) => {
  const { access_token } = req.body;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res
      .status(500)
      .json({ erro: "Supabase não configurado no backend." });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // O Supabase valida a autenticidade do token diretamente na nuvem
    const { data, error } = await supabase.auth.getUser(access_token);
    if (error || !data || !data.user) {
      return res
        .status(401)
        .json({ erro: "Autenticação social falhou ou expirou." });
    }

    const email = data.user.email || "";
    const nome =
      data.user.user_metadata?.full_name ||
      (email
        ? email.split("@")[0]
        : "Torcedor_" + Math.floor(Math.random() * 10000));
    const avatarUrl =
      data.user.user_metadata?.avatar_url ||
      data.user.user_metadata?.picture ||
      "";

    const usuarios = await lerJSON(PATH_USUARIOS, []);
    let user = usuarios.find(
      (u) =>
        (email && u.email === email) ||
        (email && u.usuario === email) ||
        u.usuario === nome,
    );

    // Se é a primeira vez desse usuário, cria uma conta automática de 'Redator'
    if (!user) {
      user = {
        id: Date.now().toString(),
        usuario: nome,
        email: email,
        senha: "", // Sem senha local
        role: "usuario", // Acesso restrito! Não é Super Admin por padrão.
        avatarUrl: avatarUrl,
      };
      usuarios.push(user);
      await salvarJSON(PATH_USUARIOS, usuarios);
    } else if (avatarUrl && user.avatarUrl !== avatarUrl) {
      user.avatarUrl = avatarUrl;
      await salvarJSON(PATH_USUARIOS, usuarios);
    }

    req.session.logado = true;
    req.session.user = {
      id: user.id,
      usuario: user.usuario,
      role: user.role,
      avatarUrl: user.avatarUrl,
    };
    return res.sendStatus(200);
  } catch (err) {
    return res.status(500).json({ erro: "Erro interno ao validar token." });
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login.html"));
});

router.get("/status", (req, res) => {
  res.json({ logado: estaLogado(req), user: req.session.user || null });
});

module.exports = router;

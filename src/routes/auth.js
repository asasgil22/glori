const express = require("express");
const router = express.Router();
const path = require("path");
const { lerJSON } = require("../config/database");
const { estaLogado } = require("../middlewares/auth");

const PATH_USUARIOS = path.join(__dirname, "../../data/usuarios.json");

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

router.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login.html"));
});

router.get("/status", (req, res) => {
  res.json({ logado: estaLogado(req), user: req.session.user || null });
});

module.exports = router;

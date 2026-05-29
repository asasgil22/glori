const express = require("express");
const router = express.Router();
const path = require("path");
const { lerJSON, salvarJSON } = require("../config/database");
const { exigirSuperAdminAPI } = require("../middlewares/auth");

const PATH_USUARIOS = path.join(__dirname, "../../data/usuarios.json");

router.get("/", exigirSuperAdminAPI, async (req, res) => {
  const usuarios = await lerJSON(PATH_USUARIOS, []);
  res.json(usuarios);
});

router.post("/", exigirSuperAdminAPI, async (req, res) => {
  try {
    const usuarios = await lerJSON(PATH_USUARIOS, []);
    if (usuarios.some((u) => u.usuario === req.body.usuario)) {
      return res.status(400).json({ erro: "Nome de usuário já existe." });
    }
    const novo = {
      id: Date.now().toString(),
      usuario: req.body.usuario,
      senha: req.body.senha,
      role: req.body.role || "usuario",
    };
    usuarios.push(novo);
    await salvarJSON(PATH_USUARIOS, usuarios);
    res.status(201).json(novo);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao criar usuário." });
  }
});

router.put("/:id", exigirSuperAdminAPI, async (req, res) => {
  try {
    const usuarios = await lerJSON(PATH_USUARIOS, []);
    const idx = usuarios.findIndex(
      (u) => String(u.id) === String(req.params.id),
    );
    if (idx === -1)
      return res.status(404).json({ erro: "Usuário não encontrado." });

    if (
      req.body.usuario &&
      req.body.usuario !== usuarios[idx].usuario &&
      usuarios.some((u) => u.usuario === req.body.usuario)
    ) {
      return res.status(400).json({ erro: "Nome de usuário já existe." });
    }

    usuarios[idx] = {
      ...usuarios[idx],
      usuario: req.body.usuario || usuarios[idx].usuario,
      senha: req.body.senha || usuarios[idx].senha,
      role: req.body.role || usuarios[idx].role,
    };
    await salvarJSON(PATH_USUARIOS, usuarios);
    res.json(usuarios[idx]);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao atualizar usuário." });
  }
});

router.delete("/:id", exigirSuperAdminAPI, async (req, res) => {
  try {
    const usuarios = await lerJSON(PATH_USUARIOS, []);
    if (
      req.session.user &&
      String(req.session.user.id) === String(req.params.id)
    ) {
      return res
        .status(400)
        .json({ erro: "Não é possível excluir o próprio usuário logado." });
    }
    await salvarJSON(
      PATH_USUARIOS,
      usuarios.filter((u) => String(u.id) !== String(req.params.id)),
    );
    res.json({ mensagem: "Usuário excluído." });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao excluir usuário." });
  }
});

module.exports = router;

function estaLogado(req) {
  return Boolean(req.session && req.session.logado);
}

function exigirLoginPagina(req, res, next) {
  if (req.path === "/admin.html" && !estaLogado(req)) {
    return res.redirect("/login.html");
  }
  next();
}

function exigirLoginAPI(req, res, next) {
  if (!estaLogado(req)) {
    return res.status(401).json({ erro: "Nao autorizado." });
  }
  next();
}

function exigirPermissaoAdmin(req, res, next) {
  if (!estaLogado(req)) {
    return res.status(401).json({ erro: "Nao autorizado." });
  }
  if (req.session.user && req.session.user.role === "usuario") {
    return res
      .status(403)
      .json({ erro: "Apenas administradores podem realizar esta ação." });
  }
  next();
}

function exigirSuperAdminAPI(req, res, next) {
  if (!estaLogado(req)) {
    return res.status(401).json({ erro: "Nao autorizado." });
  }
  if (!req.session.user || req.session.user.role !== "super_admin") {
    return res
      .status(403)
      .json({ erro: "Apenas Super Administradores podem realizar esta ação." });
  }
  next();
}

module.exports = {
  estaLogado,
  exigirLoginPagina,
  exigirLoginAPI,
  exigirPermissaoAdmin,
  exigirSuperAdminAPI,
};

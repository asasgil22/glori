<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!-- PORTAL_SEO -->
    <link
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="/css/style.css" />
  </head>
  <body class="site-body">
    <div class="reading-progress-bar"></div>

    <nav class="navbar navbar-expand-lg glass-nav sticky-top">
      <div class="container">
        <a class="navbar-brand brand-lockup" href="/" id="brand-link"></a>
        <a href="/" class="btn btn-outline-light btn-sm">Voltar para a Home</a>
      </div>
    </nav>

    <main class="container py-4">
      <article id="noticia-detalhe" class="article-shell">
        <div class="loading-box">Carregando noticia...</div>
      </article>

      <section id="noticias-relacionadas" class="mt-5 d-none">
        <h3 class="section-heading"><span>Continue lendo</span></h3>
        <div
          id="grid-relacionadas"
          class="news-list"
          style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))"
        ></div>
      </section>
    </main>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="/js/portal-theme.js"></script>
    <script src="/js/portal-brand.js"></script>
    <script src="/js/seo.js"></script>
    <script src="/js/noticia.js"></script>
  </body>
</html>

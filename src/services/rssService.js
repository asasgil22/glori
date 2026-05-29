const Parser = require("rss-parser");
const path = require("path");
const { lerJSON, salvarJSON } = require("../config/database");

const PATH_CONFIG = path.join(__dirname, "../../data/config.json");
const PATH_ESTATISTICAS = path.join(__dirname, "../../data/estatisticas.json");

const parser = new Parser({
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "application/rss+xml",
  },
  customFields: {
    item: [
      ["media:content", "media"],
      ["media:thumbnail", "thumbnail"],
      ["content:encoded", "contentEncoded"],
    ],
  },
});

const portaisRSS = [
  { nome: "FOGÃONET", url: "https://www.fogaonet.com/feed/", passeLivre: true },
  {
    nome: "GLOBO ESPORTE",
    url: "https://news.google.com/rss/search?q=Botafogo+site:ge.globo.com&hl=pt-BR&gl=BR&ceid=BR:pt-419",
    passeLivre: false,
  },
  {
    nome: "UOL ESPORTE",
    url: "https://news.google.com/rss/search?q=Botafogo+site:uol.com.br&hl=pt-BR&gl=BR&ceid=BR:pt-419",
    passeLivre: false,
  },
  {
    nome: "LANCE!",
    url: "https://news.google.com/rss/search?q=Botafogo+site:lance.com.br&hl=pt-BR&gl=BR&ceid=BR:pt-419",
    passeLivre: false,
  },
  {
    nome: "OGOL",
    url: "https://news.google.com/rss/search?q=Botafogo+site:ogol.com.br&hl=pt-BR&gl=BR&ceid=BR:pt-419",
    passeLivre: false,
  },
  {
    nome: "O DIA",
    url: "https://news.google.com/rss/search?q=Botafogo+site:odia.ig.com.br&hl=pt-BR&gl=BR&ceid=BR:pt-419",
    passeLivre: false,
  },
  {
    nome: "ESPN BRASIL",
    url: "https://news.google.com/rss/search?q=Botafogo+site:espn.com.br&hl=pt-BR&gl=BR&ceid=BR:pt-419",
    passeLivre: false,
  },
  {
    nome: "TNT SPORTS",
    url: "https://news.google.com/rss/search?q=Botafogo+site:tntsports.com.br&hl=pt-BR&gl=BR&ceid=BR:pt-419",
    passeLivre: false,
  },
  {
    nome: "365SCORES",
    url: "https://news.google.com/rss/search?q=Botafogo+site:365scores.com&hl=pt-BR&gl=BR&ceid=BR:pt-419",
    passeLivre: false,
  },
];

let cacheDeNoticiasRSS = [];
let servidorRssPronto = false;

const buscarComTimeoutRSS = (portal) => {
  return Promise.race([
    parser.parseURL(portal.url).then((feed) => ({ feed, config: portal })),
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`Timeout no portal ${portal.nome}`)),
        12000,
      ),
    ),
  ]);
};

async function obterLinkRealRSS(linkGoogle) {
  try {
    const res = await fetch(linkGoogle, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(3000),
    });
    if (
      res.url &&
      !res.url.includes("news.google.com") &&
      !res.url.includes("consent.google.com")
    ) {
      return res.url;
    }
    const html = await res.text();
    const scriptMatch = html.match(
      /window\.location\.replace\(['"]([^'"]+)['"]\)/i,
    );
    if (scriptMatch && scriptMatch[1]) return scriptMatch[1];

    const match = html.match(/<a[^>]*href=["'](https?:\/\/[^"']+)["']/i);
    if (match && match[1] && !match[1].includes("google")) return match[1];
    return linkGoogle;
  } catch (e) {
    return linkGoogle;
  }
}

async function extrairImagensRapidoRSS(noticias) {
  await Promise.all(
    noticias.map(async (noticia) => {
      if (
        noticia.portal === "FOGÃONET" &&
        noticia.imagem &&
        noticia.imagem.length > 5 &&
        !noticia.imagem.includes("google") &&
        !noticia.imagem.includes("gstatic")
      )
        return;
      const thumbOriginal = noticia.imagem || "";
      try {
        const linkReal =
          noticia.linkResolvido || (await obterLinkRealRSS(noticia.link));
        if (!noticia.linkResolvido) noticia.linkResolvido = linkReal;

        const res = await fetch(linkReal, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
          },
          signal: AbortSignal.timeout(6000),
        });
        const html = await res.text();

        const match =
          html.match(
            /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
          ) ||
          html.match(
            /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
          ) ||
          html.match(
            /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
          );

        if (
          match &&
          match[1] &&
          !match[1].includes("google") &&
          !match[1].includes("gstatic") &&
          !match[1].startsWith("data:")
        ) {
          const urlExtraida = match[1].replace(/&amp;/g, "&");
          const blocked = ["logo", "avatar", "placeholder", "default"];
          if (!blocked.some((b) => urlExtraida.toLowerCase().includes(b))) {
            noticia.imagem = urlExtraida;
          }
        }
      } catch (error) {
        if (!noticia.imagem) noticia.imagem = thumbOriginal;
      }
    }),
  );
  return noticias;
}

function formatarConteudoHtml(html) {
  if (!html || typeof html !== "string") return "";
  let texto = html;
  texto = texto.replace(/<script[^>]*>.*?<\/script>/gis, "");
  texto = texto.replace(/<style[^>]*>.*?<\/style>/gis, "");
  texto = texto.replace(/<link[^>]*>/gis, "");
  texto = texto.replace(/<meta[^>]*>/gis, "");
  texto = texto.replace(/<!--.*?-->/gis, "");
  texto = texto.replace(/<([a-zA-Z0-9]+)[^>]*>/g, (match, tag) => {
    const tagLower = tag.toLowerCase();
    if (tagLower === "a") {
      const hrefMatch = match.match(/href="([^"]*)"/i);
      if (hrefMatch)
        return `<a href="${hrefMatch[1]}" target="_blank" rel="noopener noreferrer">`;
    } else if (tagLower === "img") {
      const srcMatch = match.match(/src="([^"]*)"/i);
      if (srcMatch) return `<img src="${srcMatch[1]}" alt="Imagem da matéria">`;
    } else if (tagLower === "iframe") {
      const srcMatch = match.match(/src="([^"]*)"/i);
      if (srcMatch)
        return `<iframe width="100%" height="350" src="${srcMatch[1]}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="border-radius: 8px;"></iframe>`;
    }
    return `<${tagLower}>`;
  });
  texto = texto.replace(/(<br\s*\/?>\s*){2,}/gi, "</p><p>");
  texto = texto.replace(/<p>\s*(?:&nbsp;|\u00A0|\s)*<\/p>/gi, "");
  texto = texto.replace(/<div>\s*(?:&nbsp;|\u00A0|\s)*<\/div>/gi, "");
  return texto.trim();
}

async function atualizarCacheDeNoticiasRSS() {
  console.log(
    `[${new Date().toLocaleTimeString()}] Robô RSS: Buscando novidades...`,
  );
  try {
    const rawConfig = await lerJSON(PATH_CONFIG, {});
    const portaisPermitidos = rawConfig?.home?.portaisPermitidos || [
      "FOGÃONET",
      "GLOBO ESPORTE",
      "UOL ESPORTE",
      "LANCE!",
      "OGOL",
      "O DIA",
      "ESPN BRASIL",
      "TNT SPORTS",
      "365SCORES",
    ];

    const portaisAtivos = portaisRSS.filter((p) =>
      portaisPermitidos.includes(p.nome),
    );
    const trintaDiasAtras = Date.now() - 30 * 24 * 60 * 60 * 1000;
    let todasNoticias = [];

    let stats = await lerJSON(PATH_ESTATISTICAS, {
      totais: {},
      processados: [],
    });
    let mudouStats = false;

    const promessas = portaisAtivos.map(async (portal, index) => {
      await new Promise((resolve) => setTimeout(resolve, index * 800));
      if (portal.nome === "FOGÃONET") {
        try {
          const feedResponse = await Promise.race([
            fetch(portal.url, {
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                Accept:
                  "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
                "Upgrade-Insecure-Requests": "1",
              },
              signal: AbortSignal.timeout(8000),
            }).then(async (res) => {
              if (!res.ok) throw new Error(`Status code ${res.status}`);
              let xml = await res.text();
              xml = xml.replace(
                /\b(allowfullscreen|async|defer|controls|autoplay|muted|loop|ismap|checked|readonly|disabled|multiple|required)\b(?=[\s>])/gi,
                '$1="true"',
              );
              return parser.parseString(xml);
            }),
            new Promise((_, rj) =>
              setTimeout(() => rj(new Error("Timeout no FogãoNET")), 12000),
            ),
          ]);
          return { feed: feedResponse, config: portal };
        } catch (e) {
          console.log(
            `[Robô RSS] Bloqueio no FogãoNET (${e.message}). Acionando rota alternativa via Google News...`,
          );
          try {
            const fallbackFeed = await parser.parseURL(
              "https://news.google.com/rss/search?q=site:fogaonet.com+Botafogo&hl=pt-BR&gl=BR&ceid=BR:pt-419",
            );
            return { feed: fallbackFeed, config: portal };
          } catch (err2) {
            console.log(
              `[Robô RSS] Falha total ao ler FogãoNET: ${err2.message}`,
            );
            return { feed: { items: [] }, config: portal };
          }
        }
      }
      return await buscarComTimeoutRSS(portal);
    });

    const resultados = await Promise.allSettled(promessas);
    resultados.forEach((resultado) => {
      if (resultado.status === "fulfilled") {
        const { feed, config } = resultado.value;
        feed.items.forEach((item) => {
          let tituloLimpo = item.title || "Notícia";
          if (tituloLimpo.includes(" - "))
            tituloLimpo = tituloLimpo.substring(
              0,
              tituloLimpo.lastIndexOf(" - "),
            );
          let resumo = (
            item.contentSnippet ||
            item.content ||
            item.description ||
            ""
          )
            .replace(/<[^>]*>?/gm, "")
            .trim();
          const conteudoHtml =
            item.contentEncoded || item.content || item.description || "";
          let thumbGoogle = "";
          if (item.enclosure && item.enclosure.url) {
            thumbGoogle = item.enclosure.url;
          } else if (
            item.thumbnail &&
            item.thumbnail.$ &&
            item.thumbnail.$.url
          ) {
            thumbGoogle = item.thumbnail.$.url;
          } else if (item.media && item.media.$ && item.media.$.url) {
            thumbGoogle = item.media.$.url;
          } else {
            const matchLazy =
              conteudoHtml.match(/<img[^>]*data-src=["']([^"']+)["']/i) ||
              conteudoHtml.match(/<img[^>]*data-lazy-src=["']([^"']+)["']/i) ||
              conteudoHtml.match(/&lt;img[^&gt;]+data-src=["']([^"']+)["']/i);
            if (
              matchLazy &&
              matchLazy[1] &&
              !matchLazy[1].startsWith("data:")
            ) {
              thumbGoogle = matchLazy[1];
            } else {
              const matchImg =
                conteudoHtml.match(/<img[^>]*src=["']([^"']+)["']/i) ||
                conteudoHtml.match(/&lt;img[^&gt;]+src=["']([^"']+)["']/i);
              if (matchImg && matchImg[1] && !matchImg[1].startsWith("data:")) {
                thumbGoogle = matchImg[1];
              }
            }
          }
          const textoCheck = (tituloLimpo + " " + resumo).toLowerCase();
          const chaves = [
            "botafogo",
            "glorioso",
            "alvinegro",
            "saf",
            "artur jorge",
            "almada",
            "luiz henrique",
            "fogão",
            "bota",
          ];
          const bloqueadas = [
            "botafogo-sp",
            "botafogo sp",
            "botafogo (sp)",
            "ribeirão",
            "ribeirao",
            "pantera",
            "botafogo-pb",
            "botafogo pb",
            "botafogo (pb)",
            "paraíba",
            "paraiba",
          ];
          let isBloqueada = bloqueadas.some((palavra) =>
            textoCheck.includes(palavra),
          );
          if (config.nome === "FOGÃONET" && /\blive\b/i.test(tituloLimpo))
            isBloqueada = true;
          let dataReal = item.pubDate ? new Date(item.pubDate) : new Date();
          if (config.nome === "FOGÃONET")
            dataReal = new Date(dataReal.getTime() + 3 * 60 * 60 * 1000);
          if (
            isNaN(dataReal.getTime()) ||
            dataReal.getTime() > Date.now() + 15 * 60000
          )
            dataReal = new Date();

          if (
            dataReal.getTime() >= trintaDiasAtras &&
            !isBloqueada &&
            (config.passeLivre ||
              chaves.some((palavra) => textoCheck.includes(palavra)))
          ) {
            const linkAtual = item.link || "#";
            if (linkAtual !== "#" && !stats.processados.includes(linkAtual)) {
              stats.processados.push(linkAtual);
              if (stats.processados.length > 5000) stats.processados.shift();
              stats.totais[config.nome] = (stats.totais[config.nome] || 0) + 1;
              mudouStats = true;
            }

            todasNoticias.push({
              titulo: tituloLimpo,
              link: item.link || "#",
              resumo: resumo,
              conteudo:
                config.nome === "FOGÃONET"
                  ? formatarConteudoHtml(conteudoHtml)
                  : conteudoHtml,
              data: dataReal.toISOString(),
              imagem: thumbGoogle,
              portal: config.nome,
            });
          }
        });
      } else {
        console.log(`[Robô RSS] ⚠️ Aviso: ${resultado.reason.message}`);
      }
    });

    if (Array.isArray(cacheDeNoticiasRSS)) {
      cacheDeNoticiasRSS.forEach((noticiaAntiga) => {
        const dataAntiga = new Date(noticiaAntiga.data || 0).getTime();
        if (
          dataAntiga >= trintaDiasAtras &&
          !todasNoticias.some((n) => n.link === noticiaAntiga.link)
        ) {
          todasNoticias.push(noticiaAntiga);
        }
      });
    }

    if (mudouStats) {
      await salvarJSON(PATH_ESTATISTICAS, stats);
    }

    todasNoticias.sort(
      (a, b) =>
        new Date(b.data || 0).getTime() - new Date(a.data || 0).getTime(),
    );
    let listaLimitada = todasNoticias.slice(0, 2500);

    listaLimitada.forEach(async (noticia) => {
      if (noticia.link && noticia.link.includes("news.google.com")) {
        noticia.linkResolvido = await obterLinkRealRSS(noticia.link);
      }
    });

    cacheDeNoticiasRSS = listaLimitada;
    servidorRssPronto = true;
    console.log(
      `[${new Date().toLocaleTimeString()}] Cache RSS atualizado (Textos)! Carregando imagens em background...`,
    );

    extrairImagensRapidoRSS(listaLimitada).then((noticiasComFoto) => {
      cacheDeNoticiasRSS = noticiasComFoto;
      console.log(
        `[${new Date().toLocaleTimeString()}] Imagens do RSS carregadas com sucesso!`,
      );
    });
  } catch (error) {
    console.error("Erro no ciclo de atualização RSS:", error);
  }
}

function getCacheRSS() {
  return cacheDeNoticiasRSS;
}

function isRssPronto() {
  return servidorRssPronto;
}

module.exports = {
  atualizarCacheDeNoticiasRSS,
  getCacheRSS,
  isRssPronto,
  formatarConteudoHtml,
};

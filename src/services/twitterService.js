const { lerJSON } = require("../config/database");
const path = require("path");

const PATH_TWITTER = path.join(__dirname, "../../data/twitter.json");
const PATH_CONFIG = path.join(__dirname, "../../data/config.json");
let cacheTwitter = [];

async function atualizarCacheTwitter() {
  console.log(
    `[${new Date().toLocaleTimeString()}] 🐦 Robô: Sincronizando Feed do Twitter/X...`,
  );
  try {
    const config = await lerJSON(PATH_CONFIG, {});
    const qtdPorConta = config.home?.widgets?.twitter?.quantidadePorConta || 3;

    const criadores = await lerJSON(PATH_TWITTER, []);
    const ativos = criadores.filter((c) => c.ativo !== false);
    if (ativos.length === 0) return;

    let todosTweets = [];

    for (const criador of ativos) {
      try {
        const handle = criador.handle.replace("@", "").trim();
        const res = await fetch(
          `https://syndication.twitter.com/srv/timeline-profile/screen-name/${handle}`,
          {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
            },
            signal: AbortSignal.timeout(10000),
          },
        );

        if (res.ok) {
          const html = await res.text();
          const match = html.match(
            /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
          );
          if (match && match[1]) {
            const data = JSON.parse(match[1]);
            const tweets = data?.props?.pageProps?.timeline?.entries || [];

            let contagem = 0;
            tweets.forEach((t) => {
              if (t.type === "tweet" && t.content?.tweet) {
                if (contagem >= qtdPorConta) return;
                const tw = t.content.tweet;

                let mediaUrl = "";
                if (tw.extended_entities?.media?.length > 0) {
                  mediaUrl = tw.extended_entities.media[0].media_url_https;
                } else if (tw.entities?.media?.length > 0) {
                  mediaUrl = tw.entities.media[0].media_url_https;
                }

                todosTweets.push({
                  id: tw.id_str,
                  texto: tw.full_text,
                  data: new Date(tw.created_at).toISOString(),
                  autorNome: tw.user?.name || criador.nome,
                  autorHandle: `@${tw.user?.screen_name || handle}`,
                  autorAvatar:
                    tw.user?.profile_image_url_https || criador.avatarUrl,
                  link: `https://twitter.com/${handle}/status/${tw.id_str}`,
                  mediaUrl: mediaUrl,
                });
                contagem++;
              }
            });
          }
        }
      } catch (e) {
        console.log(
          `[Twitter] ⚠️ Aviso: Não foi possível buscar tweets de ${criador.handle}`,
        );
      }
    }

    if (todosTweets.length > 0) {
      todosTweets.sort(
        (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
      );
      cacheTwitter = todosTweets.slice(0, 15);
      console.log(
        `[${new Date().toLocaleTimeString()}] ✅ Feed do Twitter atualizado!`,
      );
    } else {
      throw new Error(
        "A API retornou um array vazio (Possível bloqueio do X/Twitter).",
      );
    }
  } catch (error) {
    console.error(`[Twitter] ⚠️ Acionando Fallback. Erro: ${error.message}`);
    const criadores = await lerJSON(PATH_TWITTER, []);
    const principal = criadores[0] || {
      nome: "Botafogo F.R.",
      handle: "@Botafogo",
      avatarUrl:
        "https://pbs.twimg.com/profile_images/1792610731773403136/O1V8vR5M_400x400.jpg",
    };

    cacheTwitter = [
      {
        id: "fallback-1",
        texto:
          "🔥 Fique por dentro de todas as novidades do Fogão diretamente nas nossas redes sociais! Acesse o nosso perfil e não perca nenhum lance. ⚽🦅",
        data: new Date().toISOString(),
        autorNome: principal.nome,
        autorHandle: principal.handle,
        autorAvatar: principal.avatarUrl,
        link: `https://twitter.com/${principal.handle.replace("@", "")}`,
      },
      {
        id: "fallback-2",
        texto:
          "⚠️ O feed do X/Twitter está temporariamente instável devido a bloqueios na rede social, mas voltaremos a sincronizar em breve!",
        data: new Date(Date.now() - 3600000).toISOString(),
        autorNome: "Portal Notícias",
        autorHandle: "@Portal",
        autorAvatar: "/escudos/escudo-padrao.png",
        link: "#",
      },
    ];
  }
}

function getCacheTwitter() {
  return cacheTwitter;
}

module.exports = { atualizarCacheTwitter, getCacheTwitter };

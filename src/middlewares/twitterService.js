const { lerJSON } = require("../config/database");
const path = require("path");

const PATH_TWITTER = path.join(__dirname, "../../data/twitter.json");
let cacheTwitter = [];

async function atualizarCacheTwitter() {
  console.log(
    `[${new Date().toLocaleTimeString()}] 🐦 Robô: Sincronizando Feed do Twitter/X...`,
  );
  try {
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

            tweets.forEach((t) => {
              if (t.type === "tweet" && t.content?.tweet) {
                const tw = t.content.tweet;
                todosTweets.push({
                  id: tw.id_str,
                  texto: tw.full_text,
                  data: new Date(tw.created_at).toISOString(),
                  autorNome: tw.user?.name || criador.nome,
                  autorHandle: `@${tw.user?.screen_name || handle}`,
                  autorAvatar:
                    tw.user?.profile_image_url_https || criador.avatarUrl,
                  link: `https://twitter.com/${handle}/status/${tw.id_str}`,
                });
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
    }
  } catch (error) {
    console.error("Erro na atualização do Twitter:", error.message);
  }
}

function getCacheTwitter() {
  return cacheTwitter;
}

module.exports = { atualizarCacheTwitter, getCacheTwitter };

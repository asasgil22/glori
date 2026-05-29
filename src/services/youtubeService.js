const { lerJSON } = require("../config/database");
const path = require("path");
const Parser = require("rss-parser");

const PATH_CONFIG = path.join(__dirname, "../../data/config.json");
const parser = new Parser();

let videoCache = null;
let lastFetchTime = 0;
const CACHE_DURATION = 2 * 60 * 1000;

async function fetchLatestVideos(config) {
  const channelId =
    config.youtubeChannelId ||
    process.env.YOUTUBE_CHANNEL_ID ||
    "@Arena.Alvinegra";
  const maxResults = config.home?.limiteVideos || 3;
  let videos = [];

  try {
    const canaisLive = [
      "@SetorVisitante",
      "@CanaldoTF",
      "@Arena.Alvinegra",
      "@TICARACATICAST",
    ];
    if (channelId && !canaisLive.includes(channelId)) {
      canaisLive.push(channelId);
    }

    const livePromises = canaisLive.map(async (cid) => {
      try {
        const liveUrl =
          cid.startsWith("@") || cid.startsWith("c/") || cid.startsWith("user/")
            ? `https://www.youtube.com/${cid}/live`
            : `https://www.youtube.com/channel/${cid}/live`;

        const liveRes = await fetch(liveUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
            "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
          },
          signal: AbortSignal.timeout(8000),
        });

        if (liveRes.ok) {
          const liveHtml = await liveRes.text();
          if (
            /<meta itemprop="isLiveBroadcast" content="True"/i.test(liveHtml) ||
            /"isLiveNow":\s*true/i.test(liveHtml)
          ) {
            const videoIdMatch =
              liveHtml.match(/"videoId":"([^"]+)"/i) ||
              liveHtml.match(
                /<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([^"]+)"/i,
              );
            const titleMatch =
              liveHtml.match(/<meta name="title" content="([^"]+)"/i) ||
              liveHtml.match(/<title>([^<]+)<\/title>/i);
            const authorMatch = liveHtml.match(
              /<link itemprop="name" content="([^"]+)">/i,
            );
            const autor = authorMatch && authorMatch[1] ? authorMatch[1] : cid;

            if (videoIdMatch && videoIdMatch[1]) {
              let title = titleMatch
                ? titleMatch[1].replace(" - YouTube", "")
                : "Transmissão ao vivo";
              return {
                id: videoIdMatch[1],
                titulo: title,
                thumbnail: `https://i.ytimg.com/vi/${videoIdMatch[1]}/maxresdefault.jpg`,
                link: `https://www.youtube.com/watch?v=${videoIdMatch[1]}`,
                isLive: true,
                autor: autor,
              };
            }
          }
        }
      } catch (e) {
        console.log(
          `[Youtube] Aviso: Verificação de Live falhou para o canal ${cid}`,
        );
      }
      return null;
    });

    const liveResults = await Promise.all(livePromises);
    liveResults.forEach((v) => {
      if (v) videos.push(v);
    });
  } catch (e) {
    console.log(`[Youtube] Aviso: Bloco de Verificação de Live falhou`);
  }

  try {
    const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const feed = await parser.parseURL(url);

    if (feed && feed.items) {
      const items = feed.items.slice(0, Math.max(maxResults, 5)).map((item) => {
        const videoId = item.id.replace("yt:video:", "");
        const titleLower = item.title.toLowerCase();
        return {
          id: videoId,
          titulo: item.title,
          thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
          link: item.link,
          isLive:
            titleLower.includes("ao vivo") ||
            titleLower.includes("live") ||
            titleLower.includes("pré-jogo") ||
            titleLower.includes("pós-jogo") ||
            titleLower.includes("transmissão"),
          autor: feed.title || "YouTube",
        };
      });
      items.forEach((item) => {
        if (!videos.some((v) => v.id === item.id)) videos.push(item);
      });
    }
  } catch (e) {
    console.log(`[Youtube] Aviso: RSS falhou para o canal ${channelId}`);
  }

  return videos;
}

function getVideoCache() {
  return videoCache;
}
function setVideoCache(cache) {
  videoCache = cache;
}
function getLastFetchTime() {
  return lastFetchTime;
}
function setLastFetchTime(time) {
  lastFetchTime = time;
}
function resetarCacheYouTube() {
  videoCache = null;
  lastFetchTime = 0;
}

module.exports = {
  fetchLatestVideos,
  getVideoCache,
  setVideoCache,
  getLastFetchTime,
  setLastFetchTime,
  resetarCacheYouTube,
  CACHE_DURATION,
};

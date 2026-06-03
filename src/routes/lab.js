const express = require("express");
const router = express.Router();
const puppeteer = require("puppeteer");
const { exigirPermissaoAdmin } = require("../middlewares/auth");

let globalBrowser = null;
async function getBrowser() {
  if (!globalBrowser) {
    globalBrowser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });
  }
  return globalBrowser;
}

router.post("/scrape", exigirPermissaoAdmin, async (req, res) => {
  const { url, seletor, preset } = req.body;
  if (!url) return res.status(400).json({ erro: "A URL é obrigatória." });

  let page;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    // Camuflagem para evitar bloqueios iniciais
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    );
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
    });

    // Otimização para economizar banda do servidor Render: Ignorar mídias e estilos
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      if (["image", "stylesheet", "font", "media"].includes(req.resourceType()))
        req.abort();
      else req.continue();
    });

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });

    let resultado = await page.evaluate(
      (sel, presetName) => {
        const configPredefinicoes = {
          ge: {
            seletores: [".materia-conteudo", ".mc-body", "article"],
            lixo: [
              ".mc-column",
              ".raw-html-embed",
              "script",
              "style",
              "nav",
              ".protected-content",
              ".banner",
            ],
          },
          uol: {
            seletores: [".text", ".article-content", ".post-content"],
            lixo: [
              ".related-links",
              ".ad",
              "script",
              "style",
              "nav",
              ".share-area",
              ".author",
            ],
          },
          lance: {
            seletores: [".post-content", "article"],
            lixo: [
              "script",
              "style",
              ".adsbygoogle",
              ".newsletter-form",
              ".jeg_share_button",
            ],
          },
          fogaonet: {
            seletores: [".entry-content", "article"],
            lixo: [
              ".fogaonet-ad",
              "script",
              "style",
              ".compartilhar",
              ".jeg_ad",
            ],
          },
          espn: {
            seletores: [".article-body", "article"],
            lixo: [
              "script",
              "style",
              ".ad-container",
              ".teads-inread",
              ".social-share",
            ],
          },
          auto: {
            seletores: [
              "article",
              "main",
              ".materia-conteudo",
              ".post-content",
              ".entry-content",
              ".content-text",
              ".texto",
            ],
            lixo: [
              "script",
              "style",
              "nav",
              "header",
              "footer",
              "aside",
              ".ad",
              ".advertisement",
              ".social-share",
              ".related",
            ],
          },
        };

        const presetConfig =
          configPredefinicoes[presetName] || configPredefinicoes.auto;
        let elementTarget = null;

        if (sel && sel.trim() !== "")
          elementTarget = document.querySelector(sel);
        else {
          for (const s of presetConfig.seletores) {
            elementTarget = document.querySelector(s);
            if (elementTarget) break;
          }
        }

        if (elementTarget) {
          const clone = elementTarget.cloneNode(true);
          presetConfig.lixo.forEach((lixoSel) =>
            clone.querySelectorAll(lixoSel).forEach((el) => el.remove()),
          );
          clone
            .querySelectorAll('iframe:not([src*="youtube"])')
            .forEach((el) => el.remove());
          clone.querySelectorAll("p, div").forEach((el) => {
            const txt = el.textContent.trim();
            if (!txt && !el.querySelector("img") && !el.querySelector("iframe"))
              el.remove();
          });
          return clone.innerHTML.trim();
        }
        return (
          document.body.innerText.substring(0, 6000) +
          "\n\n...[TEXTO TRUNCADO - SELETOR NÃO ENCONTRADO]..."
        );
      },
      seletor,
      preset,
    );

    res.json({ resultado });
  } catch (error) {
    res
      .status(500)
      .json({ erro: "Falha na conexão com o site: " + error.message });
  } finally {
    if (page) await page.close().catch(() => {});
  }
});

router.post("/extract", exigirPermissaoAdmin, async (req, res) => {
  const { url, seletor, preset } = req.body;
  if (!url) return res.status(400).json({ erro: "A URL é obrigatória." });

  let page;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    );
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
    });

    await page.setRequestInterception(true);
    page.on("request", (req) => {
      if (["stylesheet", "font", "media", "image"].includes(req.resourceType()))
        req.abort();
      else req.continue();
    });

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });

    const articleData = await page.evaluate(
      (sel, presetName) => {
        const getMeta = (prop) => {
          const tag = document.querySelector(
            `meta[property="${prop}"], meta[name="${prop}"]`,
          );
          return tag ? tag.content : "";
        };

        const titulo = getMeta("og:title") || document.title || "";
        const resumo =
          getMeta("og:description") || getMeta("description") || "";
        const imagem = getMeta("og:image") || "";

        const configPredefinicoes = {
          ge: {
            seletores: [".materia-conteudo", ".mc-body", "article"],
            lixo: [
              ".mc-column",
              ".raw-html-embed",
              "script",
              "style",
              "nav",
              ".protected-content",
              ".banner",
            ],
          },
          uol: {
            seletores: [".text", ".article-content", ".post-content"],
            lixo: [
              ".related-links",
              ".ad",
              "script",
              "style",
              "nav",
              ".share-area",
              ".author",
            ],
          },
          lance: {
            seletores: [".post-content", "article"],
            lixo: [
              "script",
              "style",
              ".adsbygoogle",
              ".newsletter-form",
              ".jeg_share_button",
            ],
          },
          fogaonet: {
            seletores: [".entry-content", "article"],
            lixo: [
              ".fogaonet-ad",
              "script",
              "style",
              ".compartilhar",
              ".jeg_ad",
            ],
          },
          espn: {
            seletores: [".article-body", "article"],
            lixo: [
              "script",
              "style",
              ".ad-container",
              ".teads-inread",
              ".social-share",
            ],
          },
          auto: {
            seletores: [
              "article",
              "main",
              ".materia-conteudo",
              ".post-content",
              ".entry-content",
              ".content-text",
              ".texto",
            ],
            lixo: [
              "script",
              "style",
              "nav",
              "header",
              "footer",
              "aside",
              ".ad",
              ".advertisement",
              ".social-share",
              ".related",
            ],
          },
        };

        const presetConfig =
          configPredefinicoes[presetName] || configPredefinicoes.auto;
        let conteudoHTML = "";
        let elementTarget = null;

        if (sel && sel.trim() !== "") {
          elementTarget = document.querySelector(sel);
        } else {
          for (const s of presetConfig.seletores) {
            elementTarget = document.querySelector(s);
            if (elementTarget) break;
          }
        }

        if (elementTarget) {
          const clone = elementTarget.cloneNode(true);
          presetConfig.lixo.forEach((lixoSel) =>
            clone.querySelectorAll(lixoSel).forEach((el) => el.remove()),
          );
          clone
            .querySelectorAll('iframe:not([src*="youtube"])')
            .forEach((el) => el.remove());
          clone.querySelectorAll("p, div").forEach((el) => {
            const txt = el.textContent.trim();
            if (!txt && !el.querySelector("img") && !el.querySelector("iframe"))
              el.remove();
          });
          conteudoHTML = clone.innerHTML.trim();
        }

        return { titulo, resumo, imagem, conteudoHTML };
      },
      seletor,
      preset,
    );

    res.json(articleData);
  } catch (error) {
    res
      .status(500)
      .json({ erro: "Falha na extração inteligente: " + error.message });
  } finally {
    if (page) await page.close().catch(() => {});
  }
});

module.exports = router;

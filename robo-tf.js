const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");
const youtubedl = require("youtube-dl-exec");
const cron = require("node-cron");
const { GoogleGenAI } = require("@google/genai");
const { createClient } = require("@supabase/supabase-js");
const Parser = require("rss-parser");
const parser = new Parser();
const nodemailer = require("nodemailer");
const { YoutubeTranscript } = require("youtube-transcript");
require("dotenv").config();

// Chaves providenciadas
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || "UCEBQbIE5JTM78eT1GcEu_kA";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const PATH_NOTICIAS = path.join(__dirname, "data", "noticias.json");

// Inicializa a Inteligência Artificial do Google Gemini
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Inicialização do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// ==============================================================
// SISTEMA DE ALERTA DE ERROS
// ==============================================================
let errosConsecutivos = 0;
const LIMITE_ERROS = 5; // Envia o email no 5º erro seguido
let ultimoEmailEnviado = 0;
const COOLDOWN_EMAIL = 4 * 60 * 60 * 1000; // 4 horas para não enviar spam

async function enviarEmailAlerta(mensagemErro) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ALERT_EMAIL } =
    process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !ALERT_EMAIL) return;

  const agora = Date.now();
  if (agora - ultimoEmailEnviado < COOLDOWN_EMAIL) return;

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT || 587,
      secure: SMTP_PORT == 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    await transporter.sendMail({
      from: `"Robô IA - Alerta" <${SMTP_USER}>`,
      to: ALERT_EMAIL,
      subject: "⚠️ Alerta Crítico: Robô IA falhando repetidamente",
      text: `O robô falhou ${LIMITE_ERROS} vezes consecutivas.\n\nÚltimo erro registrado:\n${mensagemErro}\n\nPor favor, verifique os logs do servidor e suas cotas de API.`,
    });

    ultimoEmailEnviado = agora;
    console.log(
      `[Robô IA] 📧 Email de alerta de falha enviado para ${ALERT_EMAIL}`,
    );
  } catch (err) {
    console.error(
      "[Robô IA] ❌ Falha ao tentar enviar email de alerta:",
      err.message,
    );
  }
}

async function lerNoticias() {
  if (supabase) {
    try {
      const { data } = await supabase
        .from("json_store")
        .select("dados")
        .eq("id", "noticias")
        .single();
      if (data && data.dados) return data.dados;
    } catch (e) {
      console.error("[Robô IA] Erro ao ler do Supabase:", e.message);
    }
  }

  try {
    const data = await fsPromises.readFile(PATH_NOTICIAS, "utf8");
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

async function salvarNoticias(noticias) {
  if (supabase) {
    try {
      await supabase
        .from("json_store")
        .upsert({ id: "noticias", dados: noticias });
    } catch (e) {
      console.error("[Robô IA] Erro ao salvar no Supabase:", e.message);
    }
  }

  await fsPromises.writeFile(
    PATH_NOTICIAS,
    JSON.stringify(noticias, null, 2),
    "utf8",
  );
}

function slugify(texto) {
  return (
    String(texto || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || Date.now().toString()
  );
}

async function buscarUltimosVideos() {
  // Lógica anterior restabelecida (Endpoint Search Oficial) com a Nova Chave
  const url = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=6`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.error) {
    console.error(
      "[Robô IA] ❌ Erro na API do YouTube (Cota ou Chave):",
      data.error.message,
    );
    return [];
  }

  // Filtra apenas vídeos e ignora transmissões ao vivo acontecendo no momento (live) ou agendadas (upcoming)
  return (data.items || []).filter(
    (item) =>
      item.id.kind === "youtube#video" &&
      item.snippet.liveBroadcastContent === "none",
  );
}

async function baixarAudio(videoId, tempFile) {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    await youtubedl(videoUrl, {
      format: "bestaudio/best",
      extractAudio: true,
      audioFormat: "mp3",
      output: tempFile,
      extractorArgs: "youtube:player_client=android", // O disfarce que pulou as proteções com sucesso!
    });
    return tempFile;
  } catch (err) {
    throw new Error("Erro no youtube-dl-exec: " + err.message);
  }
}

async function processarVideo(video) {
  // Extração adaptada para o novo endpoint mais barato de Playlist
  const videoId = video.snippet?.resourceId?.videoId || video.id?.videoId;
  const tituloOriginal = video.snippet.title;
  const thumbUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

  // Resgata o horário exato em que o vídeo foi publicado no YouTube
  let dataPublicacao = video.snippet?.publishedAt || new Date().toISOString();

  const noticias = await lerNoticias();

  // Verifica se este vídeo já virou matéria checando o banco JSON
  const indexExistente = noticias.findIndex(
    (n) => n.linkExterno && n.linkExterno.includes(videoId),
  );

  if (indexExistente !== -1) {
    const materiaAntiga = noticias[indexExistente];
    // Se a matéria já tiver a nova formatação de "Principais Pontos", o robô ignora e não faz nada.
    if (
      materiaAntiga.conteudo &&
      materiaAntiga.conteudo.includes("Principais Pontos") &&
      materiaAntiga.conteudo.includes("Matéria Completa")
    ) {
      return;
    } else {
      // Se for a matéria curta, ele apaga do banco de dados para gerar a versão na íntegra!
      console.log(
        `[Robô IA] ♻️ Apagando matéria antiga para gerar a versão na íntegra (com matéria completa): ${tituloOriginal}`,
      );
      // Se for uma Autocura, preservamos a data original para a matéria não pular pro topo da Index
      dataPublicacao = materiaAntiga.data || dataPublicacao;
      noticias.splice(indexExistente, 1);
      // Salva o banco sem a matéria velha antes de prosseguir
      await salvarNoticias(noticias);
    }
  }

  console.log(
    `\n[Robô IA] 📹 Novo vídeo detectado: ${tituloOriginal}. Baixando áudio...`,
  );

  const tempAudioPath = path.join(__dirname, `temp-${videoId}.mp3`);
  let fileUpload;

  try {
    await baixarAudio(videoId, tempAudioPath);

    // Validação extra de integridade: Garante que o arquivo tem peso real antes de subir pro Google
    const stats = await fsPromises.stat(tempAudioPath);
    if (stats.size < 1024) {
      throw new Error("O arquivo de mídia baixado é inválido ou está vazio.");
    }

    console.log(
      `[Robô IA] 🎙️ Áudio baixado com sucesso. Enviando para o cérebro do Gemini...`,
    );

    // Envia o áudio para a nuvem do Google
    fileUpload = await ai.files.upload({
      file: tempAudioPath,
      mimeType: "audio/mp3",
    });

    // Aguarda o Google Cloud processar o arquivo (O Gemini precisa de alguns segundos para escutar o áudio longo)
    let fileInfo = await ai.files.get({ name: fileUpload.name });
    while (fileInfo.state === "PROCESSING") {
      console.log(
        `[Robô IA] ⏳ Aguardando o Gemini processar o áudio na nuvem...`,
      );
      await new Promise((resolve) => setTimeout(resolve, 4000));
      fileInfo = await ai.files.get({ name: fileUpload.name });
    }
    if (fileInfo.state === "FAILED")
      throw new Error("Falha no processamento do áudio no Google Cloud.");

    const prompt = `
      Você é um jornalista esportivo experiente, especializado na cobertura do Botafogo para o portal GloriosoNet.
      Ouça o áudio deste vídeo do "Canal do TF" (Thiago Franklin).
      Escreva uma matéria jornalística baseada EXCLUSIVAMENTE nas informações ditas no vídeo.
      A matéria deve ter um tom informativo, direto e profissional (terceira pessoa).
      
      O campo "conteudo" deve ser estruturado em HTML da seguinte forma:
      1. Comece criando uma seção de destaque com um resumo rápido usando a tag: <div class="lead text-muted mb-4" style="font-style: italic;">Texto do resumo aqui...</div>
      2. Crie um subtítulo <h5>Principais Pontos Abordados:</h5> seguido por uma lista <ul> com os tópicos mais importantes do vídeo.
      3. Crie subtítulo <h5>Matéria Completa:</h5> seguido pela matéria detalhada, estruturada em parágrafos reais usando a tag <p>. Una as frases de forma fluida.
      
      Retorne APENAS um JSON válido com a seguinte estrutura (não use formatação de código no retorno, me dê apenas o texto puro do JSON):
      {
        "titulo": "Título chamativo e jornalístico para a matéria",
        "resumo": "Um breve resumo de no máximo 2 linhas",
        "conteudo": "HTML completo estruturado conforme as instruções acima"
      }
    `;

    const payloadGeracao = {
      contents: [
        {
          role: "user",
          parts: [
            {
              fileData: {
                fileUri: fileInfo.uri || fileUpload.uri,
                mimeType:
                  fileInfo.mimeType || fileUpload.mimeType || "audio/mp3",
              },
            },
            { text: prompt },
          ],
        },
      ],
      config: { responseMimeType: "application/json" },
    };

    // Lista de modelos em ordem de prioridade (Do mais moderno e rápido para os backups)
    const modelosGemini = [
      "gemini-2.5-flash", // (Se o Google liberar a cota gratuita no futuro, ele tenta)
      "gemini-1.5-flash-latest", // O mais rápido atual
      "gemini-1.5-flash", // A versão base do flash (às vezes a 'latest' cai e a base fica)
      "gemini-1.5-pro-latest", // O poderoso
      "gemini-1.5-pro", // A versão base do poderoso
      "gemini-1.0-pro", // O guerreiro antigo (fallback final de texto)
    ];

    let response = null;
    let ultimoErro = null;

    for (const modelo of modelosGemini) {
      try {
        console.log(
          `[Robô IA] 🧠 Tentando redigir matéria com o modelo: ${modelo}...`,
        );
        response = await ai.models.generateContent({
          model: modelo,
          ...payloadGeracao,
        });
        console.log(
          `[Robô IA] ⚡ Sucesso! Matéria gerada pelo modelo ${modelo}.`,
        );
        break; // Sai do loop assim que der certo
      } catch (errModel) {
        ultimoErro = errModel;
        const msg = (errModel.message || "").toLowerCase();

        // Verifica se é um erro que justifica trocar de modelo (Sobrecarga, Cota estourada ou Modelo aposentado/404)
        if (
          msg.includes("503") ||
          msg.includes("unavailable") ||
          msg.includes("high demand") ||
          msg.includes("429") ||
          msg.includes("resource_exhausted") ||
          msg.includes("quota") ||
          msg.includes("404") ||
          msg.includes("not found")
        ) {
          console.log(
            `[Robô IA] ⚠️ Modelo ${modelo} indisponível (Ocupado/Sem Cota). Pulando para o próximo...`,
          );
          continue;
        } else {
          // Erro grave como Chave Inválida (403), lança direto pro catch principal
          throw errModel;
        }
      }
    }

    let jsonPuro = "";

    if (!response) {
      console.log(
        `[Robô IA] ⚠️ Todos os modelos do Gemini falharam. Acionando PLANO C (Groq + Legendas)...`,
      );

      if (!process.env.GROQ_API_KEY) {
        throw (
          ultimoErro ||
          new Error(
            "Gemini falhou e a chave do Groq não está configurada no .env.",
          )
        );
      }

      try {
        console.log(`[Robô IA] 📝 Extraindo legendas do YouTube...`);
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        const textoCompleto = transcript.map((t) => t.text).join(" ");

        console.log(`[Robô IA] 🧠 Redigindo matéria com Groq (Llama 3)...`);
        const promptGroq = `
          Você é um jornalista esportivo experiente, especializado na cobertura do Botafogo para o portal GloriosoNet.
          Leia a transcrição deste vídeo do "Canal do TF" (Thiago Franklin).
          Escreva uma matéria jornalística baseada EXCLUSIVAMENTE nas informações transcritas.
          A matéria deve ter um tom informativo, direto e profissional (terceira pessoa).
          
          O campo "conteudo" deve ser estruturado em HTML da seguinte forma:
          1. Comece criando uma seção de destaque com um resumo rápido usando a tag: <div class="lead text-muted mb-4" style="font-style: italic;">Texto do resumo aqui...</div>
          2. Crie um subtítulo <h5>Principais Pontos Abordados:</h5> seguido por uma lista <ul> com os tópicos mais importantes do vídeo.
          3. Crie subtítulo <h5>Matéria Completa:</h5> seguido pela matéria detalhada, estruturada em parágrafos reais usando a tag <p>. Una as frases de forma fluida.
          
          Retorne APENAS um JSON válido com a seguinte estrutura:
          {
            "titulo": "Título chamativo e jornalístico para a matéria",
            "resumo": "Um breve resumo de no máximo 2 linhas",
            "conteudo": "HTML completo estruturado conforme as instruções acima"
          }
          \n\nTranscrição do Vídeo:\n${textoCompleto}
        `;

        const groqRes = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [{ role: "user", content: promptGroq }],
              response_format: { type: "json_object" },
            }),
          },
        );

        if (!groqRes.ok) {
          throw new Error("Erro na API do Groq: " + (await groqRes.text()));
        }

        const groqData = await groqRes.json();
        jsonPuro = groqData.choices[0].message.content;
        console.log(
          `[Robô IA] ⚡ Sucesso! Matéria gerada pelo Groq (Plano C).`,
        );
      } catch (groqErr) {
        console.log(
          `[Robô IA] ⚠️ Groq falhou. Acionando PLANO D (OpenRouter/Mistral)...`,
        );

        if (!process.env.OPENROUTER_API_KEY) {
          throw new Error(
            `Todas as IAs principais falharam. Configure a OPENROUTER_API_KEY no .env para o Plano D.`,
          );
        }

        const modelosOpenRouter = [
          "mistralai/mistral-nemo:free", // Plano D: Mistral Nemo (Europa)
          "google/gemma-2-9b-it:free", // Plano E: Gemma 2 (Google Open Source)
          "meta-llama/llama-3-8b-instruct:free", // Plano F: Llama 3 8B (Meta/Facebook)
        ];

        let openRouterSucesso = false;
        let ultimoErroOR = null;

        for (const modeloOR of modelosOpenRouter) {
          try {
            console.log(
              `[Robô IA] 🧠 Tentando OpenRouter com o modelo: ${modeloOR}...`,
            );
            const orRes = await fetch(
              "https://openrouter.ai/api/v1/chat/completions",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: modeloOR,
                  messages: [{ role: "user", content: promptGroq }],
                }),
              },
            );

            if (!orRes.ok)
              throw new Error(
                "Erro na API do OpenRouter: " + (await orRes.text()),
              );

            const orData = await orRes.json();
            jsonPuro = orData.choices[0].message.content;
            console.log(
              `[Robô IA] ⚡ Sucesso! Matéria gerada pelo OpenRouter (${modeloOR}).`,
            );
            openRouterSucesso = true;
            break;
          } catch (orErr) {
            ultimoErroOR = orErr;
            console.log(
              `[Robô IA] ⚠️ Modelo ${modeloOR} no OpenRouter falhou. Tentando o próximo...`,
            );
          }
        }

        if (!openRouterSucesso) {
          throw new Error(
            `Desastre total: Gemini, Groq e todos os modelos do OpenRouter falharam. Último erro: ${ultimoErroOR.message}`,
          );
        }
      }
    } else {
      // Caso a IA do Google Gemini tenha funcionado normalmente
      jsonPuro = response.text || "";
    }

    // Limpa qualquer formatação markdown (```json) que a IA possa ter devolvido por engano
    jsonPuro = jsonPuro
      .replace(/^```json\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    const materia = JSON.parse(jsonPuro);

    const novaNoticia = {
      id: Date.now().toString(),
      slug: slugify(materia.titulo),
      titulo: materia.titulo,
      resumo: materia.resumo,
      conteudo:
        materia.conteudo +
        `<br><br><iframe src="https://www.youtube.com/embed/${videoId}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe><p class="text-muted mt-2"><small><em>Matéria gerada automaticamente com Inteligência Artificial baseada no conteúdo do Canal do TF.</em></small></p>`,
      categoria: "Resumo do Canal do TF",
      autor: "Thiago Franklin",
      tags: ["Resumo do Canal do TF", "YouTube", "Botafogo"],
      status: "publicado",
      destaqueCarousel: false,
      data: dataPublicacao,
      imagemUrl: thumbUrl,
      visualizacoes: 0,
      linkExterno: `https://www.youtube.com/watch?v=${videoId}`,
    };

    noticias.unshift(novaNoticia);
    await salvarNoticias(noticias);

    errosConsecutivos = 0; // Se chegou aqui, deu tudo certo! Zera a contagem de falhas.
    console.log(
      `[Robô IA] ✅ Matéria redigida e publicada com sucesso: "${materia.titulo}"!`,
    );
  } catch (error) {
    const isUnplayable =
      error.message && error.message.includes("playable formats");
    console.error(
      isUnplayable
        ? `[Robô IA] ⏳ O vídeo ${videoId} ainda está sendo renderizado pelo YouTube. Tentaremos novamente na próxima varredura.`
        : `[Robô IA] ❌ Erro ao processar o vídeo ${videoId}: ${error.message || error} -> (Será tentado novamente na próxima varredura)`,
    );

    if (!isUnplayable) {
      // Ignoramos "unplayable" pois isso é normal para vídeos que acabaram de subir
      errosConsecutivos++;
      if (errosConsecutivos >= LIMITE_ERROS)
        enviarEmailAlerta(error.message || error);
    }
  } finally {
    // Limpa o arquivo temporário de áudio e deleta o arquivo no servidor do Gemini para não gastar sua cota do Cloud
    if (tempAudioPath) {
      try {
        await fsPromises.unlink(tempAudioPath);
      } catch (e) {}
    }
    if (fileUpload && fileUpload.name) {
      try {
        await ai.files.delete({ name: fileUpload.name });
      } catch (e) {}
    }
  }
}

async function executarRoboTF() {
  console.log(`\n[Robô IA] 🔎 Iniciando varredura oficial no YouTube...`);
  try {
    const videos = await buscarUltimosVideos();
    // Inverte a ordem para processar o mais antigo primeiro, mantendo a ordem correta na sua index
    videos.reverse();

    for (const video of videos) {
      await processarVideo(video);
    }
  } catch (error) {
    errosConsecutivos++;
    console.error(
      `[Robô IA] ❌ Erro na varredura do YouTube:`,
      error.response ? error.response.data : error.message,
    );
    if (errosConsecutivos >= LIMITE_ERROS) {
      enviarEmailAlerta(error.message || error);
    }
  }
}

// ==============================================================
// SMART POLLING: Agendamento Inteligente e Oficial das Varreduras
// ==============================================================

// 1. Horário de Pico (08h às 23h): Roda a cada 30 minutos (Alta velocidade de cobertura)
cron.schedule("*/30 8-23 * * *", () => {
  executarRoboTF();
});

// 2. Madrugada (00h às 07h): Roda a cada 2 horas (O canal não posta, economiza CPU)
cron.schedule("0 0-7/2 * * *", () => {
  executarRoboTF();
});

module.exports = { executarRoboTF };

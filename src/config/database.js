require("dotenv").config();
const fs = require("fs").promises;
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

if (supabase) {
  console.log("🟢 Conectado ao Supabase com sucesso!");
} else {
  console.log("🟡 Rodando com banco JSON local (Supabase não configurado).");
}

async function lerJSON(caminho, valorPadrao = []) {
  if (supabase) {
    const chave = path.basename(caminho, ".json");
    try {
      const { data } = await supabase
        .from("json_store")
        .select("dados")
        .eq("id", chave)
        .single();
      if (data && data.dados) return data.dados;
    } catch (e) {
      console.error(`Erro ao ler ${chave} do Supabase:`, e.message);
    }
  }

  try {
    const data = await fs.readFile(caminho, "utf8");
    if (!data.trim()) return valorPadrao;
    return JSON.parse(data);
  } catch {
    return valorPadrao;
  }
}

async function salvarJSON(caminho, dados) {
  if (supabase) {
    const chave = path.basename(caminho, ".json");
    try {
      await supabase.from("json_store").upsert({ id: chave, dados: dados });
    } catch (e) {
      console.error(`Erro ao salvar no Supabase:`, e.message);
    }
  }

  await fs.mkdir(path.dirname(caminho), { recursive: true });
  await fs.writeFile(caminho, JSON.stringify(dados, null, 2), "utf8");
}

module.exports = {
  supabase,
  lerJSON,
  salvarJSON,
};

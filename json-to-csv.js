const fs = require("fs");
const path = require("path");

const inputPath = path.join(__dirname, "data", "noticias.json");
const outputPath = path.join(__dirname, "data", "noticias.csv");

try {
  const rawData = fs.readFileSync(inputPath, "utf8");
  const data = JSON.parse(rawData);

  if (!Array.isArray(data) || data.length === 0) {
    console.log("⚠️ O arquivo JSON está vazio ou não é um array válido.");
    process.exit(0);
  }

  // Extrai todos os cabeçalhos únicos baseados nas chaves dos objetos JSON
  const headers = Array.from(new Set(data.flatMap(Object.keys)));

  // Função para escapar caracteres especiais do CSV
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return "";
    if (Array.isArray(value)) value = value.join(";"); // Arrays (ex: tags) viram texto separado por ponto e vírgula
    value = String(value);
    // Se houver vírgula, aspas ou quebra de linha, precisamos envolver o valor em aspas duplas
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      value = `"${value.replace(/"/g, '""')}"`; // Escapa aspas duplas dobrando-as
    }
    return value;
  };

  const csvRows = [];
  csvRows.push(headers.join(",")); // Adiciona a linha de cabeçalho

  for (const row of data) {
    const values = headers.map((header) => escapeCSV(row[header]));
    csvRows.push(values.join(","));
  }

  fs.writeFileSync(outputPath, csvRows.join("\n"), "utf8");
  console.log(`✅ Sucesso! Arquivo CSV gerado em: ${outputPath}`);
} catch (error) {
  console.error("❌ Erro ao converter arquivo:", error.message);
}

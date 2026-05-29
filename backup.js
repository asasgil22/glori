const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "data");
const backupDir = path.join(__dirname, "backups");

// Formata a data atual para o nome da pasta (ex: 2026-05-28T03-15-00)
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const targetDir = path.join(backupDir, `backup_${timestamp}`);

async function criarBackup() {
  try {
    // Cria a pasta de backups se ela não existir
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    // Copia todo o conteúdo de data/ para a nova pasta de backup
    await fs.promises.cp(dataDir, targetDir, { recursive: true });
    console.log(
      `✅ Ponto de Backup salvo com sucesso em: /backups/backup_${timestamp}`,
    );
  } catch (error) {
    console.error("❌ Erro ao criar ponto de backup:", error.message);
  }
}

criarBackup();

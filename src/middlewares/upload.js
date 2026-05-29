const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const { supabase } = require("../config/database");

const PUBLIC_DIR = path.resolve(__dirname, "../../public");
const UPLOADS_DIR = path.resolve(PUBLIC_DIR, "uploads");

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return cb(new Error("Envie apenas arquivos de imagem."));
    }
    cb(null, true);
  },
});

async function uploadParaSupabase(file) {
  if (!supabase) {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const filepath = path.join(UPLOADS_DIR, filename);
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    await fs.writeFile(filepath, file.buffer);
    return `/uploads/${filename}`;
  }

  const ext = path.extname(file.originalname || "").toLowerCase();
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

  const { data, error } = await supabase.storage
    .from("uploads")
    .upload(filename, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (error) {
    console.error("Erro no upload para Supabase:", error.message);
    throw new Error("Falha ao enviar imagem para a nuvem.");
  }

  const { data: publicUrlData } = supabase.storage
    .from("uploads")
    .getPublicUrl(filename);
  return publicUrlData.publicUrl;
}

module.exports = { upload, uploadParaSupabase };

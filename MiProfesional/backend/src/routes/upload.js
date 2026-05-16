const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { authenticate } = require("../middleware/auth");
const logger = require("../utils/logger");

const router = express.Router();

const uploadDir = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, "../../../uploads"));
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) return cb(null, true);
  cb(new Error("Tipo de archivo no soportado"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.post("/avatar", authenticate, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No se subió ningún archivo" });

    const url = `/uploads/${req.file.filename}`;
    const User = require("../models/User");
    await User.findByIdAndUpdate(req.userId, { avatar: url });

    res.json({ success: true, message: "Avatar actualizado", data: { url } });
  } catch (error) {
    logger.error("Upload avatar error:", error);
    res.status(500).json({ success: false, message: "Error al subir avatar" });
  }
});

router.post("/gallery", authenticate, upload.array("images", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No se subieron archivos" });
    }
    const urls = req.files.map((f) => `/uploads/${f.filename}`);
    res.json({ success: true, message: "Imágenes subidas", data: { urls } });
  } catch (error) {
    logger.error("Upload gallery error:", error);
    res.status(500).json({ success: false, message: "Error al subir imágenes" });
  }
});

// POST /upload/license — Upload professional license/matricula document
router.post("/license", authenticate, upload.single("license"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No se subio ningun archivo" });

    const url = `/uploads/${req.file.filename}`;
    const Professional = require("../models/Professional");
    const pro = await Professional.findOne({ userId: req.userId });

    if (!pro) return res.status(404).json({ success: false, message: "Perfil profesional no encontrado" });

    pro.verification.documents.push({ url, name: req.file.originalname, uploadedAt: new Date() });
    pro.licenseVerificationStatus = 'pending';
    pro.verification.verificationStatus = 'pending';
    await pro.save();

    res.json({ success: true, message: "Matricula subida, pendiente de verificacion", data: { url } });
  } catch (error) {
    logger.error("Upload license error:", error);
    res.status(500).json({ success: false, message: "Error al subir matricula" });
  }
});

// POST /upload/work-photos — Upload work photos (max 4)
router.post("/work-photos", authenticate, upload.array("photos", 4), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No se subieron archivos" });
    }

    const Professional = require("../models/Professional");
    const pro = await Professional.findOne({ userId: req.userId });
    if (!pro) return res.status(404).json({ success: false, message: "Perfil profesional no encontrado" });

    const photos = req.files.map(f => ({
      url: `/uploads/${f.filename}`,
      caption: req.body.caption || '',
      uploadedAt: new Date()
    }));

    pro.workPhotos.push(...photos);
    // Keep max 10 photos
    if (pro.workPhotos.length > 10) {
      pro.workPhotos = pro.workPhotos.slice(-10);
    }
    await pro.save();

    const urls = photos.map(p => p.url);
    res.json({ success: true, message: "Fotos subidas", data: { urls } });
  } catch (error) {
    logger.error("Upload work photos error:", error);
    res.status(500).json({ success: false, message: "Error al subir fotos" });
  }
});

// DELETE /upload/work-photos/:index — Delete a work photo
router.delete("/work-photos/:index", authenticate, async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    const Professional = require("../models/Professional");
    const pro = await Professional.findOne({ userId: req.userId });
    if (!pro) return res.status(404).json({ success: false, message: "Perfil profesional no encontrado" });
    if (index < 0 || index >= pro.workPhotos.length) {
      return res.status(400).json({ success: false, message: "Indice de foto invalido" });
    }
    pro.workPhotos.splice(index, 1);
    await pro.save();
    res.json({ success: true, message: "Foto eliminada" });
  } catch (error) {
    logger.error("Delete work photo error:", error);
    res.status(500).json({ success: false, message: "Error al eliminar foto" });
  }
});

module.exports = router;

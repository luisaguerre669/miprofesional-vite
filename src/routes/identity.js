const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const Professional = require("../models/Professional");
const { authenticate } = require("../middleware/auth");
const logger = require("../utils/logger");

const router = express.Router();

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
};

router.get("/status", authenticate, async (req, res) => {
  try {
    const professional = await Professional.findOne({ userId: req.userId });
    if (!professional) {
      return res.json({ success: true, data: { status: "not_applied", isVerified: false } });
    }
    res.json({
      success: true,
      data: {
        status: professional.verification?.verificationStatus || "pending",
        isVerified: professional.verification?.isVerified || false,
        verificationDate: professional.verification?.verificationDate || null
      }
    });
  } catch (error) {
    logger.error("Identity status error:", error);
    res.status(500).json({ success: false, message: "Error al obtener estado de verificación" });
  }
});

router.post("/apply", authenticate, [
  body("documents").isArray().withMessage("Se requieren documentos"),
  body("documents.*").isString()
], handleValidationErrors, async (req, res) => {
  try {
    let professional = await Professional.findOne({ userId: req.userId });
    if (!professional) {
      return res.status(404).json({ success: false, message: "Perfil profesional no encontrado. Crea tu perfil primero." });
    }

    professional.verification = {
      isVerified: false,
      verificationStatus: "pending",
      documents: req.body.documents.map(url => ({
        url,
        name: url.split("/").pop(),
        uploadedAt: new Date()
      }))
    };

    await professional.save();
    logger.info("Verification applied:", { userId: req.userId, professionalId: professional._id });

    res.json({ success: true, message: "Solicitud de verificación enviada. Revisaremos tus documentos." });
  } catch (error) {
    logger.error("Identity apply error:", error);
    res.status(500).json({ success: false, message: "Error al enviar solicitud" });
  }
});

module.exports = router;

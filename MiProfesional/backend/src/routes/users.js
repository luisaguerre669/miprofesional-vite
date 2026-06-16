const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { authenticate } = require("../middleware/auth");
const logger = require("../utils/logger");

const router = express.Router();

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: "Validation failed", errors: errors.array() });
  }
  next();
};

router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    res.json({ success: true, data: user.toJSON() });
  } catch (error) {
    logger.error("Get user error:", error);
    res.status(500).json({ success: false, message: "Error al obtener usuario" });
  }
});

router.put("/profile", authenticate, [
  body("name").optional().trim().isLength({ min: 2, max: 100 }),
  body("phone").optional().matches(/^\+?[\d\s-()]+$/),
  body("location").optional().trim().isLength({ min: 2, max: 200 }),
  body("address").optional().isObject(),
  body("address.street").optional().trim(),
  body("address.number").optional().trim(),
  body("address.neighborhood").optional().trim(),
  body("address.city").optional().trim(),
  body("address.state").optional().trim(),
  body("preferences").optional().isObject()
], handleValidationErrors, async (req, res) => {
  try {
    const allowedFields = ["name", "phone", "location", "avatar", "preferences"];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    if (req.body.address) {
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ success: false, message: "Usuario no encontrado" });
      user.address = { ...(user.address ? user.address.toObject() : {}), ...req.body.address };
      if (req.body.address.city || req.body.address.street) {
        user.markModified('address');
      }
      await user.save();
      return res.json({ success: true, message: "Perfil actualizado", data: user.toJSON() });
    }

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: "Usuario no encontrado" });

    res.json({ success: true, message: "Perfil actualizado", data: user.toJSON() });
  } catch (error) {
    logger.error("Update profile error:", error);
    res.status(500).json({ success: false, message: "Error al actualizar perfil" });
  }
});

router.get("/stats", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    res.json({ success: true, data: user.stats });
  } catch (error) {
    logger.error("Get user stats error:", error);
    res.status(500).json({ success: false, message: "Error al obtener estadísticas" });
  }
});

module.exports = router;

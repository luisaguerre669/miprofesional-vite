const express = require("express");
const { query, param, body, validationResult } = require("express-validator");
const Booking = require("../models/Booking");
const Professional = require("../models/Professional");
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

router.get("/", authenticate, async (req, res) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;
    const query = { userId: req.userId };
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate("professionalId", "businessName profession location.city")
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      data: bookings,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    logger.error("Get bookings error:", error);
    res.status(500).json({ success: false, message: "Error al obtener reservas" });
  }
});

router.post("/", authenticate, [
  body("professionalId").isMongoId(),
  body("serviceName").trim().notEmpty(),
  body("date").isISO8601(),
  body("time").matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body("price").isFloat({ min: 0 })
], handleValidationErrors, async (req, res) => {
  try {
    const professional = await Professional.findById(req.body.professionalId);
    if (!professional) {
      return res.status(404).json({ success: false, message: "Profesional no encontrado" });
    }

    const booking = new Booking({
      professionalId: req.body.professionalId,
      userId: req.userId,
      serviceName: req.body.serviceName,
      date: new Date(req.body.date),
      time: req.body.time,
      price: req.body.price,
      notes: req.body.notes
    });

    await booking.save();
    logger.info("Booking created:", { bookingId: booking._id, userId: req.userId });

    res.status(201).json({ success: true, message: "Reserva creada exitosamente", data: booking });
  } catch (error) {
    logger.error("Create booking error:", error);
    res.status(500).json({ success: false, message: "Error al crear reserva" });
  }
});

router.get("/professional", authenticate, async (req, res) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;
    const query = { professionalId: req.query.professionalId };
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate("userId", "name email phone")
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({ success: true, data: bookings });
  } catch (error) {
    logger.error("Get professional bookings error:", error);
    res.status(500).json({ success: false, message: "Error al obtener reservas" });
  }
});

router.patch("/:id/status", authenticate, [
  param("id").isMongoId(),
  body("status").isIn(["confirmed", "in_progress", "completed", "cancelled"])
], handleValidationErrors, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: "Reserva no encontrada" });

    if (booking.userId.toString() !== req.userId && booking.professionalId.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: "No tienes permiso para modificar esta reserva" });
    }

    booking.status = req.body.status;
    await booking.save();

    res.json({ success: true, message: "Estado actualizado", data: booking });
  } catch (error) {
    logger.error("Update booking status error:", error);
    res.status(500).json({ success: false, message: "Error al actualizar estado" });
  }
});

module.exports = router;

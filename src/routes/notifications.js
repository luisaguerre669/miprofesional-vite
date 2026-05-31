const express = require("express");
const Notification = require("../models/Notification");
const { authenticate } = require("../middleware/auth");
const logger = require("../utils/logger");

const router = express.Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const notifications = await Notification.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const mapped = notifications.map(n => ({
      _id: n._id,
      type: n.type === "booking" ? "success" : n.type === "message" ? "info" : n.type,
      text: n.title,
      message: n.message,
      read: n.status === "read" || n.metadata?.isRead,
      createdAt: n.createdAt
    }));

    const total = await Notification.countDocuments({ user: req.userId });
    res.json({ success: true, data: mapped, total });
  } catch (error) {
    logger.error("Get notifications error:", error);
    res.status(500).json({ success: false, message: "Error al obtener notificaciones" });
  }
});

router.patch("/:id/read", authenticate, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { status: "read", readAt: new Date(), "metadata.isRead": true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ success: false, message: "Notificación no encontrada" });
    res.json({ success: true, data: { _id: notification._id, read: true } });
  } catch (error) {
    logger.error("Mark notification read error:", error);
    res.status(500).json({ success: false, message: "Error al actualizar notificación" });
  }
});

router.post("/read-all", authenticate, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.userId, status: { $ne: "read" } },
      { status: "read", readAt: new Date(), "metadata.isRead": true }
    );
    res.json({ success: true, message: "Todas marcadas como leídas" });
  } catch (error) {
    logger.error("Mark all read error:", error);
    res.status(500).json({ success: false, message: "Error al marcar notificaciones" });
  }
});

module.exports = router;

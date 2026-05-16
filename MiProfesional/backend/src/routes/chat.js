const express = require("express");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const User = require("../models/User");
const { authenticate } = require("../middleware/auth");
const logger = require("../utils/logger");

const router = express.Router();

router.get("/conversations", authenticate, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.userId,
      isActive: true
    })
      .populate("participants", "name email avatar")
      .sort({ "lastMessage.createdAt": -1 });

    res.json({ success: true, data: conversations });
  } catch (error) {
    logger.error("Get conversations error:", error);
    res.status(500).json({ success: false, message: "Error al obtener conversaciones" });
  }
});

router.get("/conversations/:userId", authenticate, async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    let conversation = await Conversation.findOne({
      participants: { $all: [req.userId, otherUserId] },
      isActive: true
    }).populate("participants", "name email avatar");

    if (!conversation) {
      const otherUser = await User.findById(otherUserId);
      if (!otherUser) return res.status(404).json({ success: false, message: "Usuario no encontrado" });

      conversation = new Conversation({
        participants: [req.userId, otherUserId]
      });
      await conversation.save();
      await conversation.populate("participants", "name email avatar");
    }

    res.json({ success: true, data: conversation });
  } catch (error) {
    logger.error("Get or create conversation error:", error);
    res.status(500).json({ success: false, message: "Error al obtener conversación" });
  }
});

router.get("/:conversationId/messages", authenticate, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, before } = req.query;

    const query = { conversationId };
    if (before) query.createdAt = { $lt: new Date(before) };

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, data: messages.reverse() });
  } catch (error) {
    logger.error("Get messages error:", error);
    res.status(500).json({ success: false, message: "Error al obtener mensajes" });
  }
});

router.post("/:conversationId/messages", authenticate, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "El mensaje no puede estar vacío" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ success: false, message: "Conversación no encontrada" });

    const message = new Message({
      conversationId,
      senderId: req.userId,
      text: text.trim()
    });
    await message.save();

    conversation.lastMessage = { text: text.trim(), senderId: req.userId, createdAt: new Date() };
    await conversation.save();

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    logger.error("Send message error:", error);
    res.status(500).json({ success: false, message: "Error al enviar mensaje" });
  }
});

module.exports = router;

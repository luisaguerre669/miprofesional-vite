const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const logger = require("../utils/logger");

class ChatService {
  initialize(io) {
    this.io = io;
    this.onlineUsers = new Map();

    io.on("connection", (socket) => {
      logger.info("Socket connected:", socket.id);

      const userId = socket.handshake.auth?.userId;
      if (userId) {
        this.onlineUsers.set(userId, socket.id);
        socket.userId = userId;
        socket.join(`user:${userId}`);
        logger.info(`User ${userId} authenticated on socket via handshake`);
      }

      socket.on("authenticate", (userId) => {
        this.onlineUsers.set(userId, socket.id);
        socket.userId = userId;
        socket.join(`user:${userId}`);
        logger.info(`User ${userId} authenticated on socket`);
      });

      socket.on("join_conversation", (conversationId) => {
        socket.join(`conversation:${conversationId}`);
      });

      socket.on("leave_conversation", (conversationId) => {
        socket.leave(`conversation:${conversationId}`);
      });

      socket.on("send_message", async (data) => {
        try {
          const { conversationId, text } = data;
          if (!conversationId || !text) return;

          const conversation = await Conversation.findById(conversationId);
          if (!conversation) return;

          const message = new Message({
            conversationId,
            senderId: socket.userId,
            text
          });
          await message.save();

          conversation.lastMessage = {
            text,
            senderId: socket.userId,
            createdAt: new Date()
          };
          await conversation.save();

          io.to(`conversation:${conversationId}`).emit("new_message", {
            _id: message._id,
            conversationId,
            senderId: socket.userId,
            text,
            createdAt: message.createdAt
          });

          conversation.participants.forEach((participantId) => {
            if (participantId.toString() !== socket.userId) {
              io.to(`user:${participantId}`).emit("message_notification", {
                conversationId,
                text,
                senderId: socket.userId
              });
            }
          });
        } catch (error) {
          logger.error("Send message error:", error);
        }
      });

      socket.on("typing", ({ conversationId, userId }) => {
        socket.to(`conversation:${conversationId}`).emit("user_typing", { conversationId, userId });
      });

      socket.on("stop_typing", ({ conversationId, userId }) => {
        socket.to(`conversation:${conversationId}`).emit("user_stop_typing", { conversationId, userId });
      });

      socket.on("mark_read", async ({ conversationId, userId }) => {
        try {
          await Message.updateMany(
            { conversationId, senderId: { $ne: userId }, read: false },
            { read: true, readAt: new Date() }
          );
          io.to(`conversation:${conversationId}`).emit("messages_read", { conversationId, userId });
        } catch (error) {
          logger.error("Mark read error:", error);
        }
      });

      socket.on("disconnect", () => {
        if (socket.userId) {
          this.onlineUsers.delete(socket.userId);
        }
        logger.info("Socket disconnected:", socket.id);
      });
    });
  }

  isUserOnline(userId) {
    return this.onlineUsers.has(userId);
  }

  getOnlineUsers() {
    return Array.from(this.onlineUsers.keys());
  }
}

module.exports = new ChatService();

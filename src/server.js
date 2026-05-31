require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const http = require("http");
const { Server: SocketServer } = require("socket.io");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const logger = require("./utils/logger");
const requestId = require("./middleware/requestId");

// Routes
const authRoutes = require("./routes/auth");
const professionalsRoutes = require("./routes/professionals");
const categoriesRoutes = require("./routes/categories");
const bookingsRoutes = require("./routes/bookings");
const healthRoutes = require("./routes/health");
const mercadopagoRoutes = require("./routes/mercadopago.routes");
const usersRoutes = require("./routes/users");
const uploadRoutes = require("./routes/upload");
const adminRoutes = require("./routes/admin");
const analyticsRoutes = require("./routes/analytics");
const identityRoutes = require("./routes/identity");
const subscriptionRoutes = require("./routes/subscription");
const chatRoutes = require("./routes/chat");
const reviewsRoutes = require("./routes/reviews");
const ratingsRoutes = require("./routes/ratings");
const notificationsRoutes = require("./routes/notifications");
const cvRoutes = require("./routes/cv");

// Models
require("./models/Payment");
require("./models/PaymentAudit");
require("./models/Message");
require("./models/Conversation");
require("./models/Review");
require("./models/Booking");
require("./models/CurriculumVitae");

// Register event bus listeners
require("./services/emailService");

// Subscription cron (auto-expire trials)
const { startSubscriptionCron } = require("./services/subscriptionCron");

const REQUIRED_ENV_VARS = ["JWT_SECRET", "JWT_REFRESH_SECRET", "NODE_ENV"];

function validateEnvironment() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) missing.push("MONGODB_URI or MONGO_URI");
  if (process.env.NODE_ENV === "production" && !process.env.CORS_ORIGIN && !process.env.CORS_ORIGINS) {
    missing.push("CORS_ORIGIN or CORS_ORIGINS");
  }
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }
}

function getAllowedOrigins() {
  const configured = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || "";
  return configured.split(",").map((o) => o.trim()).filter(Boolean);
}

function isAllowedOrigin(origin, allowedOrigins) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return true;
  if (/^capacitor:\/\/localhost$/.test(origin)) return true;
  if (/^file:\/\//.test(origin)) return true;
  try {
    const hostname = new URL(origin).hostname;
    if (hostname.endsWith(".vercel.app")) return true;
    if (hostname.endsWith(".onrender.com")) return true;
    if (hostname === "miprofesional.com" || hostname === "www.miprofesional.com") return true;
    if (hostname === "miprofesional.online" || hostname === "www.miprofesional.online") return true;
  } catch {
    return false;
  }
  return false;
}

class Server {
  constructor() {
    validateEnvironment();
    this.app = express();
    this.port = process.env.PORT || 10000;
    this.allowedOrigins = getAllowedOrigins();
    this.server = http.createServer(this.app);

    this.io = new SocketServer(this.server, {
      cors: {
        origin: (origin, callback) => {
          if (isAllowedOrigin(origin, this.allowedOrigins)) return callback(null, true);
          return callback(new Error(`CORS origin not allowed: ${origin}`));
        },
        credentials: true,
        methods: ["GET", "POST"]
      }
    });

    this.middlewares();
    this.routes();
    this.socketEvents();
    this.setupErrorHandling();
  }

  middlewares() {
    this.app.set("trust proxy", 1);

    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false
    }));

    this.app.use(compression());
    this.app.use(requestId);
    this.app.use(logger.logRequest.bind(logger));

    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: { success: false, error: "Too many requests, please try again later." }
    });
    this.app.use("/api/", limiter);

    const corsOptions = {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin, this.allowedOrigins)) return callback(null, true);
        return callback(new Error(`CORS origin not allowed: ${origin}`));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
    };

    this.app.use(cors(corsOptions));
    this.app.options("*", cors(corsOptions));
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));
    this.app.use(require('passport').initialize());
    this.app.use(require("./middleware/inputSanitizer").inputSanitizer);
    this.app.use("/uploads", express.static(path.join(__dirname, "../../uploads")));
  }

  routes() {
    this.app.use("/health", healthRoutes);
    this.app.use("/api/health", healthRoutes);

    this.app.use("/api/auth", authRoutes);
    this.app.use("/auth", authRoutes);

    this.app.use("/api/professionals", professionalsRoutes);
    this.app.use("/api/categories", categoriesRoutes);
    this.app.use("/api/bookings", bookingsRoutes);
    this.app.use("/api/users", usersRoutes);
    this.app.use("/api/upload", uploadRoutes);
    this.app.use("/api/admin", adminRoutes);
    this.app.use("/api/analytics", analyticsRoutes);
    this.app.use("/api/identity", identityRoutes);
    this.app.use("/api/subscription", subscriptionRoutes);
  this.app.use("/api/chat", chatRoutes);
  this.app.use("/api/reviews", reviewsRoutes);
  this.app.use("/api/ratings", ratingsRoutes);
  this.app.use("/api/v1/mercadopago", mercadopagoRoutes);
  this.app.use("/api/notifications", notificationsRoutes);
  this.app.use("/api/cv", cvRoutes);

    this.app.get("/", (req, res) => {
      res.json({
        ok: true,
        message: "API MiProfesional funcionando correctamente",
        version: "2.0.0",
        developer: "LUIS AGUERRE",
        environment: process.env.NODE_ENV || "development",
        endpoints: {
          health: "/health",
          auth: "/api/auth",
          professionals: "/api/professionals",
          categories: "/api/categories",
          bookings: "/api/bookings",
          chat: "/api/chat",
          users: "/api/users",
          upload: "/api/upload",
          admin: "/api/admin",
          analytics: "/api/analytics",
          reviews: "/api/reviews",
          identity: "/api/identity",
          subscription: "/api/subscription",
          mercadopago: {
            webhook: "/api/v1/mercadopago/webhook",
            payment: "/api/v1/mercadopago/payment/:id",
            paymentsByUser: "/api/v1/mercadopago/payments/user/:userId",
            stats: "/api/v1/mercadopago/payments/stats"
          }
        }
      });
    });

    this.app.use("*", (req, res) => {
      res.status(404).json({
        ok: false,
        message: "Ruta no encontrada",
        path: req.originalUrl
      });
    });
  }

  socketEvents() {
    const chatService = require("./services/chatService");
    chatService.initialize(this.io);
  }

  setupErrorHandling() {
    this.app.use((err, req, res, next) => {
      if (err.message && err.message.startsWith("CORS origin not allowed")) {
        return res.status(403).json({ ok: false, message: "Origin not allowed", origin: req.headers.origin || null });
      }
      const errData = { method: req.method, url: req.originalUrl, ip: req.ip, requestId: req.requestId, statusCode: err.statusCode || 500, message: err.message, stack: err.stack };
      logger.error("Server error:", errData);
      res.status(500).json({ ok: false, message: "Error interno del servidor", requestId: req.requestId });
    });
  }

  setupProcessHandlers() {
    process.on("uncaughtException", (err) => {
      logger.error("UNCAUGHT EXCEPTION", { message: err.message, stack: err.stack });
      this.gracefulShutdown("uncaughtException");
    });
    process.on("unhandledRejection", (reason) => {
      logger.error("UNHANDLED REJECTION", { message: reason?.message || String(reason), stack: reason?.stack });
    });
  }

  async start() {
    this.setupProcessHandlers();
    try {
      await connectDB();

        // Fix legacy categories: update slug if title matches but slug changed
        try {
          const categoriesData = require('./scripts/categoryData');
          for (const cat of categoriesData) {
            const existing = await mongoose.model('Category').findOne({ title: cat.title });
            if (existing && existing.slug !== cat.slug) {
              existing.slug = cat.slug;
              existing.isActive = true;
              await existing.save();
            }
          }
        } catch (migrateErr) {
          logger.error('Category migration error (non-fatal)', { error: migrateErr.message });
        }

        // Sync categories (creates missing, updates existing - idempotent)
        try {
          await require('./scripts/runAutoSeed')();
        } catch (seedErr) {
          logger.error('Category sync error (non-fatal)', { error: seedErr.message });
        }

      this.server.listen(this.port, () => {
        logger.info("MiProfesional backend listening", {
          port: this.port,
          nodeEnv: process.env.NODE_ENV || "development"
        });
      });

      startSubscriptionCron();
      this.server.on("error", (error) => {
        logger.error("Server error:", error);
        process.exit(1);
      });
      process.on("SIGTERM", () => this.gracefulShutdown("SIGTERM"));
      process.on("SIGINT", () => this.gracefulShutdown("SIGINT"));
    } catch (error) {
      logger.error("FATAL ERROR starting server:", error);
      process.exit(1);
    }
  }

  gracefulShutdown(signal) {
    logger.info(`Received ${signal}, shutting down`);
    if (this.io) this.io.close();
    if (!this.server) process.exit(0);
    this.server.close(() => {
      logger.info("HTTP server closed");
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
  }
}

const server = new Server();
server.start();

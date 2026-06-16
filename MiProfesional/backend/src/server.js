require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/auth");
const bookingsRoutes = require("./routes/bookings");

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 10000;
    this.middlewares();
    this.routes();
  }

  middlewares() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  routes() {
    if (authRoutes) {
      this.app.use("/api/auth", authRoutes);
    }
    if (bookingsRoutes) {
      this.app.use("/api/bookings", bookingsRoutes);
    }

    this.app.get("/health", (req, res) => {
      res.json({
        ok: true,
        message: "Servidor saludable",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development"
      });
    });

    this.app.get("/", (req, res) => {
      res.json({
        ok: true,
        message: "API MiProfesional funcionando correctamente",
        version: "1.0.0",
        timestamp: new Date().toISOString()
      });
    });
  }

  async start() {
    try {
      await connectDB();
    } catch (error) {
      console.error("Error conectando a la base de datos:", error.message);
      process.exit(1);
    }
    this.app.listen(this.port, () => {
      console.log("Servidor corriendo en puerto", this.port);
    });
  }
}

const server = new Server();
server.start();

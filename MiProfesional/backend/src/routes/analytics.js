const express = require("express");
const User = require("../models/User");
const Professional = require("../models/Professional");
const Booking = require("../models/Booking");
const Category = require("../models/Category");
const { authenticate } = require("../middleware/auth");
const logger = require("../utils/logger");

const router = express.Router();

router.get("/dashboard", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const isAdmin = user?.role === "admin";

    let data = {};

    if (isAdmin) {
      const [userStats, profStats, bookingStats, categoryStats] = await Promise.all([
        User.getStats(),
        Professional.getStats(),
        Booking.aggregate([
          { $group: { _id: "$status", count: { $sum: 1 } } }
        ]),
        Category.getStats()
      ]);
      data = { userStats, profStats, bookingStats, categoryStats };
    } else {
      const professional = await Professional.findOne({ userId: req.userId });
      if (professional) {
        const myBookings = await Booking.find({ professionalId: professional._id });
        data = {
          totalBookings: myBookings.length,
          completed: myBookings.filter(b => b.status === "completed").length,
          cancelled: myBookings.filter(b => b.status === "cancelled").length,
          rating: professional.stats?.rating || 0,
          reviewCount: professional.stats?.reviewCount || 0
        };
      } else {
        const myBookings = await Booking.find({ userId: req.userId });
        data = {
          totalBookings: myBookings.length,
          completed: myBookings.filter(b => b.status === "completed").length,
          totalSpent: myBookings.reduce((sum, b) => sum + (b.price || 0), 0)
        };
      }
    }

    res.json({ success: true, data });
  } catch (error) {
    logger.error("Analytics error:", error);
    res.status(500).json({ success: false, message: "Error al obtener analytics" });
  }
});

router.get("/public", async (req, res) => {
  try {
    const [totalProfessionals, totalClients, totalBookings, totalCategories] = await Promise.all([
      Professional.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'client', isActive: true }),
      Booking.countDocuments(),
      Category.countDocuments({ isActive: true })
    ]);
    res.json({ success: true, data: { totalProfessionals, totalClients, totalBookings, totalCategories } });
  } catch (error) {
    logger.error("Public analytics error:", error);
    res.status(500).json({ success: false, message: "Error al obtener métricas públicas" });
  }
});

router.get("/professionals", authenticate, async (req, res) => {
  try {
    const stats = await Professional.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error("Professional analytics error:", error);
    res.status(500).json({ success: false, message: "Error al obtener analytics" });
  }
});

module.exports = router;

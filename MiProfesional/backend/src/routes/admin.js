const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const Professional = require("../models/Professional");
const Category = require("../models/Category");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const { authenticate, requireAdmin } = require("../middleware/auth");
const logger = require("../utils/logger");

const router = express.Router();

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
};

router.use(authenticate, requireAdmin);

router.get("/dashboard", async (req, res) => {
  try {
    const [totalUsers, totalProfessionals, totalBookings, totalRevenue, recentUsers, recentBookings] = await Promise.all([
      User.countDocuments(),
      Professional.countDocuments(),
      Booking.countDocuments(),
      Payment.aggregate([{ $match: { status: "approved" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email role isActive createdAt'),
      Booking.find().populate("userId", "name").sort({ createdAt: -1 }).limit(5)
    ]);

    res.json({
      success: true,
      data: {
        stats: { totalUsers, totalProfessionals, totalBookings, totalRevenue: totalRevenue[0]?.total || 0 },
        recentUsers, recentBookings
      }
    });
  } catch (error) {
    logger.error("Admin dashboard error:", error);
    res.status(500).json({ success: false, message: "Error al obtener dashboard" });
  }
});

router.get("/users", async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search, isActive } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const users = await User.find(query).sort({ createdAt: -1 }).limit(parseInt(limit)).skip((parseInt(page) - 1) * parseInt(limit)).select('-password');
    const total = await User.countDocuments(query);

    res.json({ success: true, data: users, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    logger.error("Admin users error:", error);
    res.status(500).json({ success: false, message: "Error al obtener usuarios" });
  }
});

router.patch("/users/:id/status", async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    res.json({ success: true, message: "Estado actualizado", data: user });
  } catch (error) {
    logger.error("Admin update user error:", error);
    res.status(500).json({ success: false, message: "Error al actualizar usuario" });
  }
});

router.patch("/users/:id/role", [
  body("role").isIn(["client", "professional", "admin"])
], handleValidationErrors, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    res.json({ success: true, message: "Rol actualizado", data: user });
  } catch (error) {
    logger.error("Admin update role error:", error);
    res.status(500).json({ success: false, message: "Error al actualizar rol" });
  }
});

router.get("/professionals", async (req, res) => {
  try {
    const { page = 1, limit = 20, verification, search } = req.query;
    const query = {};
    if (verification) query['verification.verificationStatus'] = verification;
    if (search) query.$or = [
      { businessName: { $regex: search, $options: 'i' } },
      { profession: { $regex: search, $options: 'i' } },
    ];

    const professionals = await Professional.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('userId', 'name email phone')
      .populate('categoryId', 'title');

    const total = await Professional.countDocuments(query);

    res.json({
      success: true,
      data: professionals,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    logger.error("Admin professionals error:", error);
    res.status(500).json({ success: false, message: "Error al obtener profesionales" });
  }
});

router.patch("/professionals/:id/verification", [
  body("status").isIn(["pending", "verified", "rejected"])
], handleValidationErrors, async (req, res) => {
  try {
    const professional = await Professional.findById(req.params.id);
    if (!professional) return res.status(404).json({ success: false, message: "Profesional no encontrado" });
    await professional.toggleVerification(req.body.status);
    res.json({ success: true, message: "Verificacion actualizada", data: professional });
  } catch (error) {
    logger.error("Admin verification error:", error);
    res.status(500).json({ success: false, message: "Error al actualizar verificacion" });
  }
});

router.patch("/professionals/:id", async (req, res) => {
  try {
    const allowed = ['businessName', 'profession', 'description', 'pricing.hourlyRate', 'isActive', 'isFeatured'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const professional = await Professional.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!professional) return res.status(404).json({ success: false, message: "Profesional no encontrado" });
    res.json({ success: true, message: "Profesional actualizado", data: professional });
  } catch (error) {
    logger.error("Admin update professional error:", error);
    res.status(500).json({ success: false, message: "Error al actualizar profesional" });
  }
});

router.delete("/professionals/:id", async (req, res) => {
  try {
    const professional = await Professional.findByIdAndDelete(req.params.id);
    if (!professional) return res.status(404).json({ success: false, message: "Profesional no encontrado" });
    res.json({ success: true, message: "Profesional eliminado" });
  } catch (error) {
    logger.error("Admin delete professional error:", error);
    res.status(500).json({ success: false, message: "Error al eliminar profesional" });
  }
});

router.get("/payments", async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = {};
    if (status) query.status = status;

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('userId', 'name email');

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      data: payments,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    logger.error("Admin payments error:", error);
    res.status(500).json({ success: false, message: "Error al obtener pagos" });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const [
      userStats,
      professionalStats,
      bookingStats,
      paymentStats,
      categoryStats,
      revenueByMonth,
    ] = await Promise.all([
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),
      Professional.aggregate([
        { $group: { _id: '$verification.verificationStatus', count: { $sum: 1 } } }
      ]),
      Booking.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Payment.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount' } } }
      ]),
      Category.aggregate([
        { $lookup: { from: 'professionals', localField: '_id', foreignField: 'categoryId', as: 'pros' } },
        { $project: { title: 1, count: { $size: '$pros' } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Payment.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$dateApproved' } }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
        { $limit: 12 }
      ]),
    ]);

    res.json({
      success: true,
      data: { userStats, professionalStats, bookingStats, paymentStats, categoryStats, revenueByMonth }
    });
  } catch (error) {
    logger.error("Admin stats error:", error);
    res.status(500).json({ success: false, message: "Error al obtener estadisticas" });
  }
});

module.exports = router;

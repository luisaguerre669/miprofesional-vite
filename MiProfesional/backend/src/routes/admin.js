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

router.post("/seed-categories", async (req, res) => {
  try {
    const cats = await Category.find();
    if (cats.length > 0) return res.json({ success: true, message: `Ya existen ${cats.length} categorias` });
    const categories = [
      { title: "Construccion", slug: "construccion", description: "Albaniles, plomeros, electricistas, gasistas, pintores, carpinteros, techistas, herreros y mas.", image: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&q=80", icon: "Building2", metadata: { color: "#b45309", featured: true }, sortOrder: 1 },
      { title: "Servicios Generales", slug: "servicios-generales", description: "Limpieza, jardineria, mudanzas, mantenimiento y reparaciones del hogar.", image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80", icon: "Wrench", metadata: { color: "#0f7a5a", featured: true }, sortOrder: 2 },
      { title: "Emergencias 24/7", slug: "emergencias", description: "Medicos, enfermeros, cuidadores, cerrajeros y servicios urgentes.", image: "https://images.unsplash.com/photo-1587745416684-47953f16fdd1?w=800&q=80", icon: "AlertTriangle", metadata: { color: "#dc2626", featured: true }, sortOrder: 3 },
      { title: "Empresas y Equipos", slug: "empresas", description: "Empresas constructoras, cuadrillas, equipos de limpieza y servicios corporativos.", image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80", icon: "Briefcase", metadata: { color: "#1d4ed8", featured: true }, sortOrder: 4 },
      { title: "Tecnologia", slug: "tecnologia", description: "Reparacion de PC, redes, camaras, soporte IT y desarrollo web.", image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80", icon: "Monitor", metadata: { color: "#7c3aed", featured: false }, sortOrder: 5 },
      { title: "Automotor", slug: "automotor", description: "Mecanica, electricidad automotriz, chapista, gomeria, lavadero y auxilio.", image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80", icon: "Car", metadata: { color: "#0891b2", featured: false }, sortOrder: 6 },
      { title: "Hogar y Confort", slug: "hogar", description: "Decoracion, arquitectura, diseno de interiores, domotica y tapiceria.", image: "https://images.unsplash.com/photo-1618220179428-22790b461013?w=800&q=80", icon: "Home", metadata: { color: "#d97706", featured: false }, sortOrder: 7 },
      { title: "Mascotas", slug: "mascotas", description: "Veterinarios, paseadores, peluqueros, adiestradores y guarderias.", image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80", icon: "Dog", metadata: { color: "#0891b2", featured: false }, sortOrder: 8 },
      { title: "Belleza y Cuidado", slug: "belleza", description: "Peluqueria, manicura, masajes, cosmetologia, barberia y depilacion.", image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80", icon: "Sparkles", metadata: { color: "#db2777", featured: false }, sortOrder: 9 },
      { title: "Gastronomia", slug: "gastronomia", description: "Chefs, catering, pasteleria, bartender y eventos gastronomicos.", image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80", icon: "ChefHat", metadata: { color: "#dc2626", featured: false }, sortOrder: 10 },
      { title: "Transporte y Turismo", slug: "transporte", description: "Remis, fletes, guias de turismo, transporte escolar y viajes.", image: "https://images.unsplash.com/photo-1603796846097-bee99e4a601f?w=800&q=80", icon: "Truck", metadata: { color: "#1d4ed8", featured: false }, sortOrder: 11 },
      { title: "Cerrajeria", slug: "cerrajeria", description: "Cerrajeros, apertura de puertas, instalacion de cerraduras y cajas de seguridad.", image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80", icon: "Lock", metadata: { color: "#65a30d", featured: false }, sortOrder: 12 },
    ];
    let created = 0;
    for (const cat of categories) {
      const exists = await Category.findOne({ slug: cat.slug });
      if (!exists) { await Category.create(cat); created++; }
    }
    logger.info("Categories seeded:", { created });
    res.json({ success: true, message: `Categorias seeded: ${created} creadas, ${categories.length - created} ya existian` });
  } catch (error) {
    logger.error("Seed categories error:", error);
    res.status(500).json({ success: false, message: "Error al seedear categorias" });
  }
});

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

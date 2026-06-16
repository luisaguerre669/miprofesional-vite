const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const Professional = require("../models/Professional");
const Category = require("../models/Category");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const CurriculumVitae = require("../models/CurriculumVitae");
const { authenticate, requireAdmin } = require("../middleware/auth");
const logger = require("../utils/logger");
const { checkCategoryQuery } = require("../utils/categoryGuard");

let maintenanceMode = { active: false, message: '' };
let featureFlags = {};

const router = express.Router();

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
};

router.use(authenticate, requireAdmin);

// Maintenance mode middleware
router.use((req, res, next) => {
  if (maintenanceMode.active && req.method !== 'GET') {
    return res.status(503).json({ success: false, message: maintenanceMode.message || 'Sistema en mantenimiento' });
  }
  next();
});

router.post("/seed-categories", async (req, res) => {
  try {
    const categoriesData = require("../scripts/categoryData");
    const cats = await Category.find();
    if (cats.length > 0) return res.json({ success: true, message: `Ya existen ${cats.length} categorias` });
    let created = 0;
    for (const cat of categoriesData) {
      const exists = await Category.findOne({ slug: cat.slug });
      if (!exists) { await Category.create(cat); created++; }
    }
    logger.info("Categories seeded:", { created });
    res.json({ success: true, message: `Categorias seeded: ${created} creadas, ${categoriesData.length - created} ya existian` });
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
      .populate('categories.categoryId', 'title');

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
        { $lookup: { from: 'professionals', let: { catId: '$_id' }, pipeline: [
          { $match: { $expr: { $in: ['$$catId', '$categories.categoryId'] } } }
        ], as: 'pros' } },
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

// ── Observability ──────────────────────────────────────────

router.get("/system-status", async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const dbState = mongoose.connection.readyState;
    const dbStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

    const [userCount, proCount, bookingCount, paymentCount] = await Promise.all([
      User.countDocuments(), Professional.countDocuments(),
      Booking.countDocuments(), Payment.countDocuments()
    ]);

    res.json({
      success: true,
      data: {
        server: logger.getStats(),
        database: { state: dbStates[dbState] || 'unknown', collections: { users: userCount, professionals: proCount, bookings: bookingCount, payments: paymentCount } },
        maintenance: maintenanceMode,
        features: featureFlags,
        recentErrors: logger.getRecentErrors(20),
        logs: logger.getLogStats()
      }
    });
  } catch (error) {
    logger.error("System status error:", error);
    res.status(500).json({ success: false, message: "Error al obtener estado del sistema" });
  }
});

router.post("/maintenance", async (req, res) => {
  try {
    const { active, message } = req.body;
    if (typeof active !== 'boolean') return res.status(400).json({ success: false, message: "'active' debe ser booleano" });
    maintenanceMode = { active, message: message || '' };
    logger.info("Maintenance mode updated", maintenanceMode);
    res.json({ success: true, data: maintenanceMode });
  } catch (error) {
    logger.error("Maintenance toggle error:", error);
    res.status(500).json({ success: false, message: "Error al cambiar modo mantenimiento" });
  }
});

router.get("/features", (req, res) => {
  res.json({ success: true, data: featureFlags });
});

router.post("/features", async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ success: false, message: "'key' es requerido" });
    featureFlags[key] = value;
    logger.info("Feature flag updated", { key, value });
    res.json({ success: true, data: featureFlags });
  } catch (error) {
    logger.error("Feature flag error:", error);
    res.status(500).json({ success: false, message: "Error al actualizar feature flag" });
  }
});

router.post("/clear-errors", (req, res) => {
  logger.clearErrors();
  res.json({ success: true, message: "Errores recientes limpiados" });
});

// Reprocess subscription webhook for a user (admin trigger)
router.post("/reprocess-webhook/:userId", async (req, res) => {
  try {
    const User = require('../models/User');
    const Professional = require('../models/Professional');
    const Payment = require('../models/Payment');

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: "Usuario no encontrado" });

    const payment = await Payment.findOne({ userId: user._id, status: 'approved' }).sort({ createdAt: -1 });
    if (!payment) return res.status(404).json({ success: false, message: "No hay pagos aprobados para este usuario" });

    const months = payment.plan === 'semester' ? 6 : 1;
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    user.membership = {
      type: "premium", plan: payment.plan, expiresAt,
      benefits: payment.plan === 'semester'
        ? ["Acceso completo a la plataforma", "Ahorro del 15%"]
        : ["Acceso completo a la plataforma"]
    };
    await user.save();

    const professional = await Professional.findOne({ userId: user._id });
    if (professional) {
      professional.isActive = true;
      professional.profileStatus = 'ACTIVE';
      professional.subscription = {
        ...(professional.subscription || {}),
        status: "active",
        plan: payment.plan,
        paymentId: String(payment.mpPaymentId || payment._id),
        lastPayment: new Date(),
        nextBilling: expiresAt,
        activatedAt: new Date(),
      };
      await professional.save();
    }

    logger.info("Webhook reprocessed by admin", { userId: user._id, plan: payment.plan, paymentId: payment._id });
    res.json({ success: true, message: "Suscripcion reactivada manualmente" });
  } catch (error) {
    logger.error("Reprocess webhook error:", error);
    res.status(500).json({ success: false, message: "Error al reprocesar webhook" });
  }
});

// ── Data Cleanup ────────────────────────────────────────────

router.post("/clean-test-data", async (req, res) => {
  try {
    const patterns = [
      /^test/i, /^fix/i, /^idx/i, /^flow/i, /^final/i, /^prueba/i,
      /^demo/i, /^fake/i, /^temp/i, /^dummy/i, /^sample/i, /^a@a\./i,
      /^b@b\./i, /^user\d/i,
    ];
    const allUsers = await User.find({}, '_id email');
    const toDelete = allUsers.filter(u => patterns.some(p => p.test(u.email)));
    const ids = toDelete.map(u => u._id);

    const result = { users: 0, professionals: 0, bookings: 0, payments: 0 };

    if (ids.length > 0) {
      result.payments = (await Payment.deleteMany({ userId: { $in: ids } })).deletedCount;
      result.bookings = (await Booking.deleteMany({ userId: { $in: ids } })).deletedCount;
      result.professionals = (await Professional.deleteMany({ userId: { $in: ids } })).deletedCount;
      result.users = (await User.deleteMany({ _id: { $in: ids } })).deletedCount;
    }

    logger.info("Test data cleaned", result);
    res.json({ success: true, message: `Datos de prueba eliminados: ${result.users} usuarios, ${result.professionals} profesionales, ${result.bookings} reservas, ${result.payments} pagos`, deleted: result });
  } catch (error) {
    logger.error("Clean test data error:", error);
    res.status(500).json({ success: false, message: "Error al limpiar datos de prueba" });
  }
});

// Delete a user and all their associated data
router.delete("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: "No se puede eliminar un administrador" });

    const result = {};
    result.payments = (await Payment.deleteMany({ userId: user._id })).deletedCount;
    result.bookings = (await Booking.deleteMany({ userId: user._id })).deletedCount;
    result.professionals = (await Professional.deleteMany({ userId: user._id })).deletedCount;
    await User.findByIdAndDelete(user._id);

    logger.info("User deleted by admin", { userId: user._id, email: user.email, related: result });
    res.json({ success: true, message: `Usuario y ${result.professionals + result.bookings + result.payments} registros asociados eliminados` });
  } catch (error) {
    logger.error("Admin delete user error:", error);
    res.status(500).json({ success: false, message: "Error al eliminar usuario" });
  }
});

// ── Categories CRUD ──────────────────────────────────────────

// GET /admin/categories
router.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1, title: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    logger.error("Admin categories error:", error);
    res.status(500).json({ success: false, message: "Error al obtener categorias" });
  }
});

// POST /admin/categories
router.post("/categories", [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("slug").optional().trim(),
  body("image").optional().trim(),
  body("icon").optional().trim(),
  body("sortOrder").optional().isInt(),
], handleValidationErrors, async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.json({ success: true, data: category });
  } catch (error) {
    logger.error("Admin create category error:", error);
    res.status(500).json({ success: false, message: "Error al crear categoria" });
  }
});

// PUT /admin/categories/:id
router.put("/categories/:id", async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) return res.status(404).json({ success: false, message: "Categoria no encontrada" });
    res.json({ success: true, data: category });
  } catch (error) {
    logger.error("Admin update category error:", error);
    res.status(500).json({ success: false, message: "Error al actualizar categoria" });
  }
});

// DELETE /admin/categories/:id
router.delete("/categories/:id", async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Categoria eliminada" });
  } catch (error) {
    logger.error("Admin delete category error:", error);
    res.status(500).json({ success: false, message: "Error al eliminar categoria" });
  }
});

// ── Professional Categories (admin) ─────────────────────────

// GET /admin/professionals/:id/categories
router.get("/professionals/:id/categories", async (req, res) => {
  try {
    const pro = await Professional.findById(req.params.id).populate('categories.categoryId', 'title');
    if (!pro) return res.status(404).json({ success: false, message: "Profesional no encontrado" });
    res.json({ success: true, data: pro.categories || [] });
  } catch (error) {
    logger.error("Admin get pro categories error:", error);
    res.status(500).json({ success: false, message: "Error al obtener categorias" });
  }
});

// PUT /admin/professionals/:id/categories
router.put("/professionals/:id/categories", async (req, res) => {
  try {
    const pro = await Professional.findById(req.params.id);
    if (!pro) return res.status(404).json({ success: false, message: "Profesional no encontrado" });
    pro.categories = req.body.categories || [];
    if (req.body.workModalities !== undefined) pro.workModalities = req.body.workModalities;
    if (req.body.primaryCategory !== undefined) pro.primaryCategory = req.body.primaryCategory;
    if (req.body.commerceType !== undefined) pro.commerceType = req.body.commerceType;
    if (req.body.subCategory !== undefined) pro.subCategory = req.body.subCategory;
    if (req.body.tags !== undefined) pro.tags = req.body.tags;
    await pro.save();
    res.json({ success: true, data: pro });
  } catch (error) {
    logger.error("Admin update pro categories error:", error);
    res.status(500).json({ success: false, message: "Error al actualizar categorias" });
  }
});

// POST /admin/marketplace-apply — Apply marketplace category to all or filtered professionals
router.post("/marketplace-apply", async (req, res) => {
  try {
    const { primaryCategory, commerceType, subCategory, tags, filter } = req.body;
    const query = filter || {};
    if (primaryCategory) query.primaryCategory = { $ne: primaryCategory };
    const result = await Professional.updateMany(query, {
      $set: { primaryCategory, commerceType: commerceType || null, subCategory: subCategory || null, tags: tags || [] }
    });
    logger.info("Marketplace categories applied", { primaryCategory, modifiedCount: result.modifiedCount });
    res.json({ success: true, message: `${result.modifiedCount} profesionales actualizados`, modifiedCount: result.modifiedCount });
  } catch (error) {
    logger.error("Admin marketplace apply error:", error);
    res.status(500).json({ success: false, message: "Error al aplicar categorias marketplace" });
  }
});

// ── Migration ───────────────────────────────────────────────

// POST /admin/migrate-categories
router.post("/migrate-categories", async (req, res) => {
  try {
    const pros = await Professional.find({
      $and: [
        { categoryId: { $ne: null } },
        { $or: [ { categories: { $exists: false } }, { categories: { $size: 0 } } ] }
      ]
    });
    let migrated = 0;
    for (const pro of pros) {
      pro.categories = [{ categoryId: pro.categoryId, subcategoryId: pro.subcategoryId || null }];
      await pro.save();
      migrated++;
    }
    logger.info("Categories migration completed", { migrated });
    res.json({ success: true, message: `${migrated} profesionales migrados al nuevo formato categories[]`, migrated });
  } catch (error) {
    logger.error("Migration error:", error);
    res.status(500).json({ success: false, message: "Error en migracion" });
  }
});

// GET /admin/cvs — List all CVs with pagination, search, and filters
router.get("/cvs", async (req, res) => {
  try {
    const { search, profession, completeness, category, status: statusFilter, subcategory, page = 1, limit = 15 } = req.query;
    const pageNum = Math.max(parseInt(page), 1);
    const limitNum = Math.min(Math.max(parseInt(limit), 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (profession) filter["personalData.headline"] = { $regex: profession, $options: "i" };
    if (category) filter.primaryCategory = category;
    if (statusFilter) filter.status = statusFilter;
    if (subcategory) filter.subCategory = { $regex: subcategory, $options: "i" };
    if (completeness === "complete") {
      filter["personalData.fullName"] = { $ne: "", $exists: true };
      filter["personalData.headline"] = { $ne: "", $exists: true };
      filter["skills.0"] = { $exists: true };
    }
    if (completeness === "incomplete") {
      filter.$or = [
        { $or: [{ "personalData.fullName": "" }, { "personalData.fullName": { $exists: false } }, { "personalData.fullName": null }] },
        { $or: [{ "personalData.headline": "" }, { "personalData.headline": { $exists: false } }, { "personalData.headline": null }] },
        { $or: [{ "skills": { $size: 0 } }, { "skills": { $exists: false } }] }
      ];
    }

    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      const searchClause = {
        $or: [
          { "personalData.fullName": searchRegex },
          { "personalData.email": searchRegex },
          { "personalData.phone": searchRegex }
        ]
      };
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, searchClause];
        delete filter.$or;
      } else {
        filter.$or = searchClause.$or;
      }
    }

    const cvs = await CurriculumVitae.find(filter)
      .populate("userId", "name email phone avatar role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await CurriculumVitae.countDocuments(filter);

    const data = cvs.map(cv => ({
      _id: cv._id,
      fullName: cv.personalData?.fullName || "Sin nombre",
      email: cv.personalData?.email || "",
      phone: cv.personalData?.phone || "",
      profession: cv.personalData?.headline || cv.jobTitles?.[0] || "",
      skillsCount: cv.skills?.length || 0,
      isComplete: cv.isComplete,
      status: cv.status,
      featured: cv.featured,
      primaryCategory: cv.primaryCategory,
      commerceType: cv.commerceType,
      subCategory: cv.subCategory,
      tags: cv.tags || [],
      createdAt: cv.createdAt,
      userId: cv.userId ? { _id: cv.userId._id, name: cv.userId.name, email: cv.userId.email } : null
    }));

    res.json({
      success: true,
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error("Admin get CVs error:", error);
    res.status(500).json({ success: false, message: "Error al obtener curriculums" });
  }
});

// GET /admin/cvs/:id — Get CV full detail
router.get("/cvs/:id", async (req, res) => {
  try {
    const cv = await CurriculumVitae.findById(req.params.id)
      .populate("userId", "name email phone avatar role createdAt");
    if (!cv) return res.status(404).json({ success: false, message: "CV no encontrado" });
    res.json({ success: true, data: cv });
  } catch (error) {
    logger.error("Admin get CV detail error:", error);
    res.status(500).json({ success: false, message: "Error al obtener detalle del CV" });
  }
});

// PATCH /admin/cvs/:id/status — Update CV status
router.patch("/cvs/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ["nuevo", "revisado", "aprobado", "rechazado"];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: "Estado invalido" });
    const cv = await CurriculumVitae.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!cv) return res.status(404).json({ success: false, message: "CV no encontrado" });
    logger.info("Admin CV status updated", { cvId: req.params.id, status });
    res.json({ success: true, data: { _id: cv._id, status: cv.status } });
  } catch (error) {
    logger.error("Admin update CV status error:", error);
    res.status(500).json({ success: false, message: "Error al actualizar estado del CV" });
  }
});

// PATCH /admin/cvs/:id/featured — Toggle featured
router.patch("/cvs/:id/featured", async (req, res) => {
  try {
    const cv = await CurriculumVitae.findById(req.params.id);
    if (!cv) return res.status(404).json({ success: false, message: "CV no encontrado" });
    cv.featured = !cv.featured;
    await cv.save();
    logger.info("Admin CV featured toggled", { cvId: req.params.id, featured: cv.featured });
    res.json({ success: true, data: { _id: cv._id, featured: cv.featured } });
  } catch (error) {
    logger.error("Admin toggle CV featured error:", error);
    res.status(500).json({ success: false, message: "Error al cambiar destacado del CV" });
  }
});

// DELETE /admin/cvs/:id — Delete CV
router.delete("/cvs/:id", async (req, res) => {
  try {
    const cv = await CurriculumVitae.findByIdAndDelete(req.params.id);
    if (!cv) return res.status(404).json({ success: false, message: "CV no encontrado" });
    logger.info("Admin CV deleted", { cvId: req.params.id });
    res.json({ success: true, message: "CV eliminado correctamente" });
  } catch (error) {
    logger.error("Admin delete CV error:", error);
    res.status(500).json({ success: false, message: "Error al eliminar CV" });
  }
});

// POST /admin/migrate-marketplace — Run full marketplace migration (Seguridad → Comercio, assign primaryCategory)
router.post("/migrate-marketplace", async (req, res) => {
  try {
    const Category = require("../models/Category");
    const Professional = require("../models/Professional");

    const comercioSubSlugs = [
      'com-farmacia', 'com-optica', 'com-kiosco', 'com-rotiseria', 'com-tienda',
      'com-perfumeria', 'com-almacen', 'com-panaderia', 'com-carniceria', 'com-verduleria',
      'com-heladeria', 'com-libreria', 'com-jugueteria', 'com-ferreteria', 'com-bazar',
      'com-muebleria', 'com-electro', 'com-alimentos-mayorista', 'com-bebidas-mayorista',
      'com-distribuidora', 'com-limpieza-industrial', 'com-mixto-almacen', 'com-mixto-tienda',
      'com-mixto-dual', 'almacen', 'supermercado', 'dietetica', 'carniceria', 'panaderia',
      'verduleria', 'vineria', 'heladeria', 'libreria', 'indumentaria', 'regalos',
      'ferreteria', 'electrodomesticos', 'farmacia', 'perfumeria', 'jugueteria',
      'tienda-mascotas', 'casa-repuestos', 'muebleria', 'bazar', 'productos-regionales',
      'cerrajeria-comercial'
    ];

    const seguridadSlugs = ['vigilancia-privada', 'alarmas-monitoreo', 'seguridad-electronica', 'seguridad-personal', 'proteccion-incendios', 'seguridad'];

    const allPros = await Professional.find({});
    let updated = 0;
    let migratedFromSeguridad = 0;

    for (const pro of allPros) {
      if (pro.primaryCategory) continue;
      let needsSave = false;

      const catIds = (pro.categories || []).map(c => c.categoryId?.toString()).filter(Boolean);
      const cats = await Category.find({ _id: { $in: catIds } }).lean();
      const proSlugs = cats.map(c => c.slug);

      const hasCommerceCat = proSlugs.some(s => comercioSubSlugs.includes(s));
      const hasSeguridadCat = proSlugs.some(s => seguridadSlugs.includes(s));

      if (hasCommerceCat || hasSeguridadCat) {
        pro.primaryCategory = 'comercio';
        pro.commerceType = 'minorista';
        const foundSlug = proSlugs.find(s => comercioSubSlugs.includes(s));
        pro.subCategory = foundSlug ? foundSlug.split('-').slice(1).join(' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Tienda';
        if (hasSeguridadCat) {
          migratedFromSeguridad++;
          pro.tags = pro.tags || [];
          if (!pro.tags.includes('24hs')) pro.tags.push('24hs');
        }
        needsSave = true;
      } else {
        pro.primaryCategory = 'professional';
        needsSave = true;
      }

      if (needsSave) {
        await pro.save();
        updated++;
      }
    }

    const slugsToDeprecate = ['seguridad', 'delivery'];
    for (const slug of slugsToDeprecate) {
      await Category.updateOne({ slug }, { isActive: false });
    }

    res.json({ success: true, message: `Migracion completada`, migratedFromSeguridad, updated, total: allPros.length });
  } catch (error) {
    logger.error("Admin marketplace migration error:", error);
    res.status(500).json({ success: false, message: "Error en migracion marketplace" });
  }
});

module.exports = router;

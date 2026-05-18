const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const Professional = require("../models/Professional");
const Payment = require("../models/Payment");
const { authenticate } = require("../middleware/auth");
const logger = require("../utils/logger");
const { MercadoPagoConfig, Preference, Payment: MpPayment } = require("mercadopago");

const FRONTEND_URL = process.env.FRONTEND_URL || "https://www.miprofesional.online";

const router = express.Router();

const MONTHLY_PRICE = 10000;
const SEMESTER_MONTHS = 6;
const SEMESTER_DISCOUNT = 0.15;
const SEMESTER_PRICE = Math.round(MONTHLY_PRICE * SEMESTER_MONTHS * (1 - SEMESTER_DISCOUNT));

router.get("/plans", (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: "monthly",
        name: "Suscripcion Mensual",
        price: MONTHLY_PRICE,
        duration: "1 mes",
        benefits: ["Perfil destacado en busquedas", "Recibe contactos de clientes", "Sin comisiones por servicio", "Panel de control", "Soporte prioritario"],
      },
      {
        id: "semester",
        name: "Suscripcion Semestral",
        price: SEMESTER_PRICE,
        duration: "6 meses",
        originalPrice: MONTHLY_PRICE * SEMESTER_MONTHS,
        discount: `${SEMESTER_DISCOUNT * 100}%`,
        benefits: ["Perfil destacado en busquedas", "Recibe contactos de clientes", "Sin comisiones por servicio", "Panel de control", "Soporte prioritario", "Ahorro del 15%"],
      },
    ]
  });
});

router.get("/status", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: "Usuario no encontrado" });

    const now = new Date();
    const membership = user.membership || { type: "free", expiresAt: null };

    let status = "inactive";
    let expiresAt = membership.expiresAt;
    let daysRemaining = 0;
    let plan = "";

    if (membership.type === "premium" && expiresAt) {
      if (now < new Date(expiresAt)) {
        status = "active";
        daysRemaining = Math.ceil((new Date(expiresAt) - now) / (1000 * 60 * 60 * 24));
        plan = membership.plan || "monthly";
      } else {
        status = "expired";
      }
    } else {
      const professional = await Professional.findOne({ userId: req.userId });
      if (professional && professional.subscription?.status === "pending_payment") {
        status = "pending_payment";
      }
    }

    res.json({
      success: true,
      data: {
        status,
        plan,
        expiresAt,
        daysRemaining: Math.max(0, daysRemaining),
        monthlyPrice: MONTHLY_PRICE,
        semesterPrice: SEMESTER_PRICE,
        isVisible: status === "active",
      }
    });
  } catch (error) {
    logger.error("Get subscription status error:", error);
    res.status(500).json({ success: false, message: "Error al obtener estado de suscripcion" });
  }
});



router.post("/create-preference", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: "Usuario no encontrado" });

    const plan = req.body.plan || "monthly";
    const isSemester = plan === "semester";
    const months = isSemester ? SEMESTER_MONTHS : 1;
    const amount = isSemester ? SEMESTER_PRICE : MONTHLY_PRICE;
    const title = isSemester
      ? `Suscripcion Semestral MiProfesional - ${user.name || "Profesional"}`
      : `Suscripcion Mensual MiProfesional - ${user.name || "Profesional"}`;
    const description = isSemester
      ? "Suscripcion semestral al marketplace de servicios profesionales (15% descuento)"
      : "Suscripcion mensual al marketplace de servicios profesionales";

    const externalReference = `sub_${plan}_${req.userId}_${Date.now()}`;
    const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
    const preference = new Preference(client);

    const mpResponse = await preference.create({
      body: {
        items: [{
          id: `sub_${plan}`,
          title,
          description,
          quantity: 1,
          currency_id: "ARS",
          unit_price: amount,
        }],
        payer: {
          name: user.name || "",
          email: user.email || "",
        },
        back_urls: {
          success: `${FRONTEND_URL}/payment/success`,
          failure: `${FRONTEND_URL}/payment/failure`,
          pending: `${FRONTEND_URL}/payment/pending`,
        },
        auto_return: "approved",
        external_reference: externalReference,
        notification_url: `${process.env.BACKEND_URL || "https://miprofesional-backend.onrender.com"}/api/subscription/webhook`,
        purpose: "subscription",
      }
    });

    const preferenceId = mpResponse.id;
    const initPoint = mpResponse.init_point;
    const sandboxInitPoint = mpResponse.sandbox_init_point;

    await Payment.create({
      mpPaymentId: `pending_${externalReference}`,
      preferenceId,
      externalReference,
      userId: req.userId,
      type: "subscription",
      status: "pending",
      amount,
      description,
    });

    const professional = await Professional.findOne({ userId: req.userId });
    if (professional) {
      professional.subscription = {
        ...(professional.subscription || {}),
        mpPreferenceId: preferenceId,
        mpInitPoint: initPoint,
        selectedPlan: plan,
      };
      await professional.save();
    }

    logger.info("MP preference created:", { userId: req.userId, plan, preferenceId, externalReference });

    res.json({
      success: true,
      data: {
        preferenceId,
        initPoint,
        sandboxInitPoint,
        externalReference,
        plan,
        amount,
      }
    });
  } catch (error) {
    logger.error("Create preference error:", error);
    res.status(500).json({ success: false, message: "Error al crear preferencia de pago" });
  }
});

router.post("/webhook", async (req, res) => {
  try {
    const { type, data } = req.body;

    logger.info("Subscription webhook received:", { type, data });

    if (type === "payment") {
      const paymentId = data.id;
    const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
      const mpPaymentClient = new MpPayment(client);

      const mpPayment = await mpPaymentClient.get({ id: paymentId });
      const { status, external_reference, payer } = mpPayment;

      const existingPayment = await Payment.findByMpId(paymentId);
      if (existingPayment) {
        await existingPayment.updateStatus(status, mpPayment);
      } else if (external_reference) {
        await Payment.findOneAndUpdate(
          { externalReference: external_reference },
          {
            mpPaymentId: paymentId,
            status,
            dateApproved: status === "approved" ? new Date() : undefined,
            payer: { id: payer?.id, email: payer?.email },
            dateLastUpdated: new Date(),
          }
        );
      }

      if (status === "approved" && external_reference) {
        const parts = external_reference.replace("sub_", "").split("_");
        const plan = parts[0];
        const userId = parts[1];
        const months = plan === "semester" ? SEMESTER_MONTHS : 1;

        const user = await User.findById(userId);
        if (user) {
          const expiresAt = new Date();
          expiresAt.setMonth(expiresAt.getMonth() + months);

          user.membership = {
            type: "premium",
            plan,
            expiresAt,
            benefits: ["Perfil destacado en busquedas", "Recibe contactos de clientes", "Sin comisiones por servicio", "Panel de control", "Soporte prioritario"],
          };
          await user.save();

          const professional = await Professional.findOne({ userId });
          if (professional) {
            professional.isActive = true;
            professional.subscription = {
              ...(professional.subscription || {}),
              status: "active",
              plan,
              paymentId: String(paymentId),
              lastPayment: new Date(),
              nextBilling: expiresAt,
              activatedAt: new Date(),
            };
            await professional.save();
          }

          logger.info("Subscription payment approved:", { userId, plan, paymentId, externalReference, expiresAt, months });
        }
      }
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    logger.error("Webhook processing error:", error);
    res.status(200).json({ ok: true });
  }
});

router.post("/cancel", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    user.membership = { type: "free", expiresAt: null, benefits: [] };
    await user.save();

    const professional = await Professional.findOne({ userId: req.userId });
    if (professional) {
      professional.isActive = false;
      if (professional.subscription) {
        professional.subscription.status = "cancelled";
        professional.subscription.cancelledAt = new Date();
      }
      await professional.save();
    }

    res.json({ success: true, message: "Suscripcion cancelada. Tu perfil ya no sera visible en el marketplace." });
  } catch (error) {
    logger.error("Cancel subscription error:", error);
    res.status(500).json({ success: false, message: "Error al cancelar suscripcion" });
  }
});

module.exports = router;

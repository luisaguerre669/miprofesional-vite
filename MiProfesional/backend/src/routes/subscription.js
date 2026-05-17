const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const Professional = require("../models/Professional");
const Payment = require("../models/Payment");
const { authenticate } = require("../middleware/auth");
const logger = require("../utils/logger");
const { MercadoPagoConfig, Preference, Payment: MpPayment } = require("mercadopago");

const FRONTEND_URL = "https://frontend-rust-chi-eom3nydslb.vercel.app";

const router = express.Router();

const SUBSCRIPTION_PRICE = 10000;
const TRIAL_DAYS = 30;

router.get("/plans", (req, res) => {
  res.json({
    success: true,
    data: [
      { id: "trial", name: "Prueba Gratis", price: 0, duration: `${TRIAL_DAYS} dias`, benefits: ["Perfil visible en el marketplace", "Recibir contactos de clientes", "Panel de control"] },
      { id: "monthly", name: "Suscripcion Mensual", price: SUBSCRIPTION_PRICE, duration: "1 mes", benefits: ["Perfil destacado en busquedas", "Recibe contactos de clientes", "Sin comisiones por servicio", "Panel de control", "Soporte prioritario"] },
    ]
  });
});

router.get("/status", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: "Usuario no encontrado" });

    const professional = await Professional.findOne({ userId: req.userId });

    const now = new Date();
    const membership = user.membership || { type: "free", expiresAt: null };

    let status = "inactive";
    let expiresAt = membership.expiresAt;
    let trialEnd = null;
    let daysRemaining = 0;

    if (professional && professional.subscription) {
      trialEnd = professional.subscription.trialEnd;
      if (professional.subscription.status === "trial" && trialEnd) {
        daysRemaining = Math.ceil((new Date(trialEnd) - now) / (1000 * 60 * 60 * 24));
        status = daysRemaining > 0 ? "trial" : "expired_trial";
      }
    }

    if (membership.type === "premium" && expiresAt && now < new Date(expiresAt)) {
      status = "active";
      daysRemaining = Math.ceil((new Date(expiresAt) - now) / (1000 * 60 * 60 * 24));
    }

    if (membership.type === "premium" && expiresAt && now >= new Date(expiresAt)) {
      status = "expired";
    }

    res.json({
      success: true,
      data: {
        status,
        plan: membership.type,
        expiresAt,
        trialEnd,
        daysRemaining: Math.max(0, daysRemaining),
        price: SUBSCRIPTION_PRICE,
        isVisible: status === "active" || status === "trial",
      }
    });
  } catch (error) {
    logger.error("Get subscription status error:", error);
    res.status(500).json({ success: false, message: "Error al obtener estado de suscripcion" });
  }
});

router.post("/free-trial", authenticate, async (req, res) => {
  try {
    const professional = await Professional.findOne({ userId: req.userId });
    if (!professional) {
      return res.status(400).json({ success: false, message: "Debes tener perfil profesional" });
    }

    if (professional.subscription && professional.subscription.status === "trial") {
      return res.status(400).json({ success: false, message: "Ya activaste tu prueba gratis" });
    }

    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);

    professional.subscription = {
      status: "trial",
      trialStart: new Date(),
      trialEnd,
      activatedAt: new Date(),
    };
    await professional.save();

    const user = await User.findById(req.userId);
    user.membership = {
      type: "premium",
      expiresAt: trialEnd,
      benefits: ["Perfil visible en el marketplace", "Recibir contactos de clientes", "Panel de control"],
    };
    await user.save();

    logger.info("Free trial activated:", { userId: req.userId, trialEnd });

    res.json({
      success: true,
      message: "Prueba gratis activada! Disfruta de 30 dias sin costo.",
      data: { trialEnd, daysRemaining: TRIAL_DAYS }
    });
  } catch (error) {
    logger.error("Free trial error:", error);
    res.status(500).json({ success: false, message: "Error al activar prueba gratis" });
  }
});

router.post("/create-preference", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: "Usuario no encontrado" });

    const externalReference = `sub_${req.userId}_${Date.now()}`;
    const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
    const preference = new Preference(client);

    const mpResponse = await preference.create({
      body: {
        items: [{
          id: "sub_monthly",
          title: `Suscripcion MiProfesional - ${user.name || "Profesional"}`,
          description: "Suscripcion mensual al marketplace de servicios profesionales",
          quantity: 1,
          currency_id: "ARS",
          unit_price: SUBSCRIPTION_PRICE,
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
        notification_url: `https://miprofesional-backend.onrender.com/api/subscription/webhook`,
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
      amount: SUBSCRIPTION_PRICE,
      description: "Suscripcion mensual MiProfesional",
    });

    const professional = await Professional.findOne({ userId: req.userId });
    if (professional) {
      professional.subscription = {
        ...(professional.subscription || {}),
        mpPreferenceId: preferenceId,
        mpInitPoint: initPoint,
      };
      await professional.save();
    }

    logger.info("MP preference created:", { userId: req.userId, preferenceId, externalReference });

    res.json({
      success: true,
      data: {
        preferenceId,
        initPoint,
        sandboxInitPoint,
        externalReference,
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
        const userId = external_reference.replace("sub_", "").split("_")[0];
        const user = await User.findById(userId);
        if (user) {
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + TRIAL_DAYS);

          user.membership = {
            type: "premium",
            expiresAt,
            benefits: ["Perfil destacado en busquedas", "Recibe contactos de clientes", "Sin comisiones por servicio", "Panel de control", "Soporte prioritario"],
          };
          await user.save();

          const professional = await Professional.findOne({ userId });
          if (professional) {
            professional.subscription = {
              ...(professional.subscription || {}),
              status: "active",
              lastPayment: new Date(),
              nextBilling: expiresAt,
            };
            await professional.save();
          }

          logger.info("Subscription payment approved:", { userId, externalReference, expiresAt });
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
    if (professional && professional.subscription) {
      professional.subscription.status = "cancelled";
      professional.subscription.cancelledAt = new Date();
      await professional.save();
    }

    res.json({ success: true, message: "Suscripcion cancelada. Tu perfil ya no sera visible en el marketplace." });
  } catch (error) {
    logger.error("Cancel subscription error:", error);
    res.status(500).json({ success: false, message: "Error al cancelar suscripcion" });
  }
});

module.exports = router;

const express = require("express");
const User = require("../models/User");
const Professional = require("../models/Professional");
const Payment = require("../models/Payment");
const { authenticate } = require("../middleware/auth");
const logger = require("../utils/logger");
const eventBus = require("../services/eventBus");
const { MercadoPagoConfig, PreApproval } = require("mercadopago");
const { PLANS } = require("../config/plans");

const FRONTEND_URL = process.env.FRONTEND_URL || "https://www.miprofesional.online";
const router = express.Router();

router.get("/plans", (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: "professional",
        name: PLANS.professional.name,
        price: PLANS.professional.price,
        durationDays: PLANS.professional.durationDays,
        description: PLANS.professional.description,
        benefits: PLANS.professional.benefits,
        cta: "Activar suscripcion",
        forRole: "professional",
        recurring: false,
        highlighted: false,
      },
      {
        id: "company",
        name: PLANS.company.name,
        price: PLANS.company.price,
        durationDays: PLANS.company.durationDays,
        description: PLANS.company.description,
        benefits: PLANS.company.benefits,
        cta: "Adquirir Plan Empresa",
        forRole: "company",
        recurring: false,
        highlighted: true,
      },
    ]
  });
});

router.get("/status", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: "Usuario no encontrado" });

    const now = new Date();
    const subscription = user.subscription || { plan: "free", status: "inactive" };
    const membership = user.membership || { type: "free", expiresAt: null };

    let status = "inactive";
    let plan = subscription.plan || "free";
    let endDate = subscription.endDate || null;
    let daysRemaining = 0;
    let isVisible = false;

    if (user.role === "company" || user.role === "employer") {
      if (subscription.status === "active") {
        if (subscription.endDate && now < new Date(subscription.endDate)) {
          status = "active";
          daysRemaining = Math.ceil((new Date(subscription.endDate) - now) / (1000 * 60 * 60 * 24));
          isVisible = true;
        } else if (subscription.endDate && now >= new Date(subscription.endDate)) {
          status = "expired";
          user.subscription.status = "suspended";
          await user.save();
        } else {
          status = "active";
          isVisible = true;
          daysRemaining = 30;
        }
      } else if (subscription.status === "suspended") {
        status = "suspended";
      }
    } else {
      if (membership.type === "premium") {
        if (membership.expiresAt) {
          if (now < new Date(membership.expiresAt)) {
            status = "active";
            daysRemaining = Math.ceil((new Date(membership.expiresAt) - now) / (1000 * 60 * 60 * 24));
            plan = membership.plan || "monthly";
            isVisible = true;
          } else {
            status = "expired";
          }
        } else {
          status = "active";
          plan = membership.plan || "monthly";
          isVisible = true;
          daysRemaining = 30;
        }
      } else {
        const professional = await Professional.findOne({ userId: req.userId });
        if (professional) {
          if (professional.subscription?.status === "trial" && professional.profileStatus === "ACTIVE") {
            status = "trial";
            daysRemaining = Math.ceil((new Date(professional.subscription.trialEnd) - now) / (1000 * 60 * 60 * 24));
            endDate = professional.subscription.trialEnd;
            isVisible = true;
          } else if (professional.profileStatus === "ACTIVE") {
            status = "active";
            isVisible = true;
          } else if (professional.subscription?.status === "suspended") {
            status = "suspended";
          } else if (professional.subscription?.status === "pending_payment") {
            status = "pending_payment";
          }
        }
      }
    }

    res.json({
      success: true,
      data: {
        status,
        plan,
        endDate,
        daysRemaining: Math.max(0, daysRemaining),
        price: plan === "company" ? PLANS.company.price : PLANS.professional.price,
        trialDays: 30,
        isVisible,
        isRecurring: membership.type === "premium" && !membership.expiresAt,
      }
    });
  } catch (error) {
    logger.error("Get subscription status error:", error);
    res.status(500).json({ success: false, message: "Error al obtener estado de suscripcion" });
  }
});

router.post("/create-preference", authenticate, async (req, res) => {
  try {
    const { plan } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: "Usuario no encontrado" });

    const planConfig = PLANS[plan];
    if (!planConfig) return res.status(400).json({ success: false, message: "Plan invalido" });

    const { Preference } = require("mercadopago");
    const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
    const preference = new Preference(client);

    const externalReference = `payment_${plan}_${req.userId}_${Date.now()}`;

    const mpResponse = await preference.create({
      body: {
        items: [
          {
            title: planConfig.name,
            unit_price: planConfig.price,
            quantity: 1,
            currency_id: "ARS",
          },
        ],
        metadata: {
          userId: req.userId,
          plan: plan,
          durationDays: planConfig.durationDays,
          userRole: user.role,
        },
        external_reference: externalReference,
        back_urls: {
          success: `${FRONTEND_URL}/payment/success`,
          failure: `${FRONTEND_URL}/payment/failure`,
          pending: `${FRONTEND_URL}/payment/pending`,
        },
        notification_url: `${process.env.BACKEND_URL || "https://miprofesional-backend.onrender.com"}/api/payments/webhook`,
      },
    });

    await Payment.create({
      mpPaymentId: `pending_${externalReference}`,
      preferenceId: mpResponse.id,
      externalReference,
      userId: req.userId,
      type: "subscription",
      status: "pending",
      amount: planConfig.price,
      description: `${planConfig.name} - MiProfesional`,
      metadata: { plan, durationDays: planConfig.durationDays },
    });

    logger.info("Payment preference created:", { userId: req.userId, plan, preferenceId: mpResponse.id, externalReference });

    res.json({
      success: true,
      data: {
        preferenceId: mpResponse.id,
        initPoint: mpResponse.init_point,
        externalReference,
        plan,
        amount: planConfig.price,
      }
    });
  } catch (error) {
    logger.error("Create payment preference error:", error);
    res.status(500).json({ success: false, message: "Error al crear preferencia de pago" });
  }
});

router.post("/create-preapproval", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: "Usuario no encontrado" });

    const professional = await Professional.findOne({ userId: req.userId });
    const now = new Date();
    let startDate = new Date(now);

    if (professional && professional.subscription?.status === "trial" && professional.subscription?.trialEnd) {
      startDate = new Date(professional.subscription.trialEnd);
    }

    const MONTHLY_PRICE = 5000;
    const externalReference = `pre_monthly_${req.userId}_${Date.now()}`;
    const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
    const preApproval = new PreApproval(client);

    const mpResponse = await preApproval.create({
      body: {
        reason: "MiProfesional - $5.000/mes",
        external_reference: externalReference,
        payer_email: user.email,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: MONTHLY_PRICE,
          currency_id: "ARS",
          start_date: startDate.toISOString(),
        },
        back_url: {
          success: `${FRONTEND_URL}/payment/success`,
          failure: `${FRONTEND_URL}/payment/failure`,
          pending: `${FRONTEND_URL}/payment/pending`,
        },
        notification_url: `${process.env.BACKEND_URL || "https://miprofesional-backend.onrender.com"}/api/subscription/webhook`,
      }
    });

    const preapprovalId = mpResponse.id;
    const initPoint = mpResponse.init_point;

    await Payment.create({
      mpPaymentId: `pending_${externalReference}`,
      preferenceId: preapprovalId,
      externalReference,
      userId: req.userId,
      type: "subscription",
      status: "pending",
      amount: MONTHLY_PRICE,
      description: "Suscripcion mensual MiProfesional",
    });

    if (professional) {
      professional.subscription = {
        ...(professional.subscription || {}),
        mpPreferenceId: preapprovalId,
        mpInitPoint: initPoint,
        selectedPlan: "monthly",
        preapproval: true,
      };
      await professional.save();
    }

    logger.info("MP preapproval created:", { userId: req.userId, preapprovalId, externalReference, startDate });

    res.json({
      success: true,
      data: {
        preapprovalId,
        initPoint,
        externalReference,
        plan: "monthly",
        amount: MONTHLY_PRICE,
        startDate,
      }
    });
  } catch (error) {
    logger.error("Create preapproval error:", error);
    res.status(500).json({ success: false, message: "Error al crear suscripcion recurrente" });
  }
});

router.post("/webhook", async (req, res) => {
  try {
    const { type, data } = req.body;
    logger.info("Subscription webhook received:", { type, data });

    if (type === "preapproval") {
      const preapprovalId = data.id;
      const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
      const preApprovalClient = new PreApproval(client);
      const mpPreapproval = await preApprovalClient.get({ id: preapprovalId });
      const { status, external_reference } = mpPreapproval;

      logger.info("Preapproval update:", { preapprovalId, status, external_reference });

      if (status === "authorized" && external_reference) {
        const userId = external_reference.replace("pre_monthly_", "").split("_")[0];
        const user = await User.findById(userId);
        if (user) {
          user.membership = { type: "premium", plan: "monthly", expiresAt: null };
          await user.save();

          const professional = await Professional.findOne({ userId });
          if (professional) {
            professional.isActive = true;
            professional.profileStatus = "ACTIVE";
            professional.subscription = {
              ...(professional.subscription || {}),
              status: "active",
              plan: "monthly",
              paymentId: String(preapprovalId),
              mpPreferenceId: preapprovalId,
              lastPayment: new Date(),
              nextBilling: null,
              activatedAt: new Date(),
              preapproval: true,
            };
            await professional.save();
          }

          logger.info("Preapproval authorized - subscription active:", { userId, preapprovalId });
          eventBus.emit("payment:approved", {
            email: user.email,
            name: user.name || user.email,
            plan: "Mensual",
            amount: 5000,
            expiryDate: "Renovacion automatica mensual",
          });
        }
      } else if (status === "cancelled" && external_reference) {
        const userId = external_reference.replace("pre_monthly_", "").split("_")[0];
        const user = await User.findById(userId);
        if (user) {
          user.membership = { type: "free", expiresAt: null, benefits: [] };
          await user.save();
        }
        const professional = await Professional.findOne({ userId });
        if (professional) {
          professional.isActive = false;
          professional.profileStatus = "INACTIVE";
          if (professional.subscription) {
            professional.subscription.status = "cancelled";
            professional.subscription.cancelledAt = new Date();
          }
          await professional.save();
        }
        logger.info("Preapproval cancelled - subscription deactivated:", { userId, preapprovalId });
      }
      return res.status(200).json({ ok: true });
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
    user.subscription = { plan: "free", status: "inactive" };
    await user.save();

    const professional = await Professional.findOne({ userId: req.userId });
    if (professional) {
      professional.isActive = false;
      professional.profileStatus = "INACTIVE";
      if (professional.subscription) {
        professional.subscription.status = "cancelled";
        professional.subscription.cancelledAt = new Date();
      }
      await professional.save();
    }

    res.json({ success: true, message: "Suscripcion cancelada." });
  } catch (error) {
    logger.error("Cancel subscription error:", error);
    res.status(500).json({ success: false, message: "Error al cancelar suscripcion" });
  }
});

module.exports = router;

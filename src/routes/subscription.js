const express = require("express");
const User = require("../models/User");
const Professional = require("../models/Professional");
const Payment = require("../models/Payment");
const { authenticate } = require("../middleware/auth");
const logger = require("../utils/logger");
const eventBus = require("../services/eventBus");
const { MercadoPagoConfig, PreApproval } = require("mercadopago");

const FRONTEND_URL = process.env.FRONTEND_URL || "https://www.miprofesional.online";
const router = express.Router();
const MONTHLY_PRICE = 5000;

router.get("/plans", (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: "monthly",
        name: "Plan Mensual",
        price: MONTHLY_PRICE,
        description: "30 días gratis, luego $5.000/mes. Suscripcion recurrente, cancelá cuando quieras.",
        cta: "Activar suscripcion",
        duration: "1 mes",
        recurring: true,
        trialDays: 30,
        benefits: ["Primer mes completamente gratis", "Suscripcion recurrente automatica", "Cancelacion sin cargo en cualquier momento", "Perfil visible en el marketplace"],
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
    let isVisible = false;

    if (membership.type === "premium") {
      if (membership.expiresAt) {
        if (now < new Date(expiresAt)) {
          status = "active";
          daysRemaining = Math.ceil((new Date(expiresAt) - now) / (1000 * 60 * 60 * 24));
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
          expiresAt = professional.subscription.trialEnd;
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

    res.json({
      success: true,
      data: {
        status,
        plan,
        expiresAt,
        daysRemaining: Math.max(0, daysRemaining),
        price: MONTHLY_PRICE,
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
            amount: MONTHLY_PRICE,
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

    res.json({ success: true, message: "Suscripcion cancelada. Tu perfil ya no sera visible en el marketplace." });
  } catch (error) {
    logger.error("Cancel subscription error:", error);
    res.status(500).json({ success: false, message: "Error al cancelar suscripcion" });
  }
});

module.exports = router;

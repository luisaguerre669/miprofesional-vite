const logger = require('../utils/logger');
const eventBus = require('./eventBus');
const templates = require('./emailTemplates');

const QUEUE_DELAY = 500;
const queue = [];
let processing = false;

function getTransporter() {
  const nodemailer = require('nodemailer');
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

async function sendMail({ to, subject, html }) {
  const transporter = getTransporter();
  if (!transporter) {
    logger.info('Email not configured, link available in logs', { subject, to });
    return { sent: false };
  }
  try {
    await transporter.sendMail({ from: `"MiProfesional" <${process.env.SMTP_USER}>`, to, subject, html });
    logger.info('Email sent', { subject, to });
    return { sent: true };
  } catch (error) {
    logger.error('Email send error', { subject, to, error: error.message });
    return { sent: false };
  }
}

function enqueue(job) {
  queue.push(job);
  processQueue();
}

async function processQueue() {
  if (processing || queue.length === 0) return;
  processing = true;
  while (queue.length > 0) {
    const job = queue.shift();
    await sendMail(job);
    await new Promise(r => setTimeout(r, QUEUE_DELAY));
  }
  processing = false;
}

// ── Event Handlers ──────────────────────────────────────────

eventBus.on('user:registered', ({ email, name, token }) => {
  enqueue({ to: email, subject: 'Verifica tu cuenta en MiProfesional', html: templates.verifyEmail(name, token) });
});

eventBus.on('user:verified', ({ email, name }) => {
  enqueue({ to: email, subject: 'Email verificado - Bienvenido a MiProfesional', html: templates.welcome(name) });
});

eventBus.on('user:password-reset-requested', ({ email, name, token }) => {
  enqueue({ to: email, subject: 'Restablece tu contrasena en MiProfesional', html: templates.passwordReset(name, token) });
});

eventBus.on('user:password-changed', ({ email, name }) => {
  enqueue({ to: email, subject: 'Tu contrasena fue actualizada', html: templates.passwordChanged(name) });
});

eventBus.on('payment:approved', ({ email, name, plan, amount, expiryDate }) => {
  enqueue({ to: email, subject: 'Pago confirmado - Suscripcion activa', html: templates.paymentConfirmed(name, plan, amount, expiryDate) });
});

eventBus.on('subscription:expired', ({ email, name }) => {
  enqueue({ to: email, subject: 'Tu suscripcion ha vencido', html: templates.subscriptionExpired(name) });
});

eventBus.on('professional:new-contact', ({ email, name, clientName, clientPhone, clientEmail, message }) => {
  enqueue({ to: email, subject: `Nuevo contacto de ${clientName}`, html: templates.newContact(name, clientName, clientPhone, clientEmail, message) });
});

module.exports = { sendMail, enqueue };

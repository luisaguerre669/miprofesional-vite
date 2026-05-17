const logger = require("../utils/logger");

const FRONTEND_URL = process.env.FRONTEND_URL || "https://frontend-rust-chi-eom3nydslb.vercel.app";

function getTransporter() {
  const nodemailer = require("nodemailer");
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function sendVerificationEmail(email, name, token) {
  const verifyUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

  try {
    const transporter = getTransporter();

    if (!transporter) {
      logger.info("Email service not configured. Verification link:", verifyUrl);
      return { sent: false, verifyUrl };
    }

    await transporter.sendMail({
      from: `"MiProfesional" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Verifica tu cuenta en MiProfesional",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <div style="text-align:center;margin-bottom:24px">
            <div style="width:48px;height:48px;background:#0f7a5a;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:20px">MP</div>
          </div>
          <h1 style="font-size:20px;color:#111;text-align:center">Verifica tu correo electronico</h1>
          <p style="color:#555;font-size:14px;text-align:center">Gracias por registrarte en MiProfesional. Hace clic en el boton de abajo para verificar tu direccion de correo electronico.</p>
          <div style="text-align:center;margin:24px 0">
            <a href="${verifyUrl}" style="display:inline-block;padding:12px 32px;background:#0f7a5a;color:white;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px">Verificar cuenta</a>
          </div>
          <p style="color:#888;font-size:12px;text-align:center">Si no creaste una cuenta en MiProfesional, ignora este mensaje.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0" />
          <p style="color:#aaa;font-size:11px;text-align:center">MiProfesional - Plataforma de conexion entre clientes y profesionales</p>
        </div>
      `,
    });

    logger.info("Verification email sent:", { email });
    return { sent: true, verifyUrl };
  } catch (error) {
    logger.error("Error sending verification email:", error);
    return { sent: false, verifyUrl };
  }
}

module.exports = { sendVerificationEmail };

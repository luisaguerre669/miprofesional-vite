const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.miprofesional.online';

function wrapper(title, body) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
.container{max-width:560px;margin:0 auto;padding:24px 16px}
.card{background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
.logo{width:48px;height:48px;background:#0f7a5a;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:20px;text-decoration:none;margin-bottom:20px}
h1{font-size:20px;color:#111;margin:0 0 12px}
p{color:#555;font-size:14px;line-height:1.6;margin:0 0 16px}
.btn{display:inline-block;padding:13px 36px;background:#0f7a5a;color:#fff!important;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;margin:8px 0}
.footer{border-top:1px solid #eee;margin-top:24px;padding-top:16px;text-align:center}
.footer p{color:#aaa;font-size:11px;margin:2px 0}
.footer .brand{color:#888;font-size:12px;font-weight:600}
</style></head><body>
<div class="container"><div class="card"><div style="text-align:center">
<a href="${FRONTEND_URL}" class="logo">MP</a></div>
${body}
<div class="footer"><p class="brand">MiProfesional</p>
<p>Plataforma de conexion entre clientes y profesionales</p>
<p>${FRONTEND_URL}</p></div></div></div>
</body></html>`;
}

const templates = {
  verifyEmail(name, token) {
    const url = `${FRONTEND_URL}/verify-email?token=${token}`;
    return wrapper('Verifica tu cuenta', `
      <h1 style="text-align:center">Verifica tu correo electronico</h1>
      <p style="text-align:center">Gracias por registrarte, ${name}. Hace clic en el boton para verificar tu direccion de correo.</p>
      <div style="text-align:center"><a href="${url}" class="btn">Verificar cuenta</a></div>
      <p style="text-align:center;color:#888;font-size:12px">Si no creaste una cuenta, ignora este mensaje.</p>
    `);
  },

  welcome(name) {
    return wrapper('Bienvenido a MiProfesional', `
      <h1 style="text-align:center">Email verificado correctamente</h1>
      <p style="text-align:center">Bienvenido a MiProfesional, ${name}. Tu cuenta ya esta verificada y podes empezar a usar la plataforma.</p>
      <div style="text-align:center"><a href="${FRONTEND_URL}" class="btn">Ir a MiProfesional</a></div>
    `);
  },

  passwordReset(name, token) {
    const url = `${FRONTEND_URL}/reset-password?token=${token}`;
    return wrapper('Restablece tu contrasena', `
      <h1 style="text-align:center">Restablece tu contrasena</h1>
      <p style="text-align:center">Recibimos una solicitud para restablecer la contrasena de ${name}. Hace clic en el boton para crear una nueva.</p>
      <div style="text-align:center"><a href="${url}" class="btn">Restablecer contrasena</a></div>
      <p style="text-align:center;color:#888;font-size:12px">Si no solicitaste este cambio, ignora este mensaje. El enlace expira en 10 minutos.</p>
    `);
  },

  passwordChanged(name) {
    return wrapper('Contrasena actualizada', `
      <h1 style="text-align:center">Contrasena actualizada</h1>
      <p style="text-align:center">Hola ${name}, tu contrasena de MiProfesional fue cambiada correctamente.</p>
      <p style="text-align:center;color:#888;font-size:12px">Si no realizaste este cambio, contactanos inmediatamente.</p>
      <div style="text-align:center"><a href="${FRONTEND_URL}/login" class="btn">Iniciar sesion</a></div>
    `);
  },

  paymentConfirmed(name, plan, amount, expiryDate) {
    return wrapper('Pago confirmado', `
      <h1 style="text-align:center">Pago recibido correctamente</h1>
      <p style="text-align:center">Gracias ${name}, tu suscripcion <strong>${plan === 'semester' ? 'Semestral' : 'Mensual'}</strong> esta activa.</p>
      <p style="text-align:center;font-size:16px;font-weight:700;color:#0f7a5a">$${amount.toLocaleString()} ARS</p>
      <p style="text-align:center;color:#666;font-size:13px">Tu suscripcion vence el ${expiryDate}.</p>
      <div style="text-align:center"><a href="${FRONTEND_URL}/dashboard/professional" class="btn">Ir al dashboard</a></div>
    `);
  },

  subscriptionExpired(name) {
    return wrapper('Suscripcion vencida', `
      <h1 style="text-align:center">Tu suscripcion ha vencido</h1>
      <p style="text-align:center">Hola ${name}, tu suscripcion en MiProfesional ha expirado. Tu perfil ya no aparece en los resultados de busqueda.</p>
      <p style="text-align:center">Renova tu suscripcion para seguir activo en el marketplace.</p>
      <div style="text-align:center"><a href="${FRONTEND_URL}/subscriptions" class="btn">Renovar suscripcion</a></div>
    `);
  },

  newContact(name, clientName, clientPhone, clientEmail, message) {
    return wrapper('Nuevo contacto', `
      <h1 style="text-align:center">Nuevo contacto de cliente</h1>
      <p style="text-align:center">Hola ${name}, tienes un nuevo interesado en tus servicios.</p>
      <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:4px 0"><strong>Nombre:</strong> ${clientName}</p>
        <p style="margin:4px 0"><strong>Email:</strong> ${clientEmail}</p>
        ${clientPhone ? `<p style="margin:4px 0"><strong>Telefono:</strong> ${clientPhone}</p>` : ''}
        ${message ? `<p style="margin:4px 0"><strong>Mensaje:</strong> ${message}</p>` : ''}
      </div>
      <div style="text-align:center"><a href="${FRONTEND_URL}/messages" class="btn">Ver mensajes</a></div>
    `);
  },
};

module.exports = templates;

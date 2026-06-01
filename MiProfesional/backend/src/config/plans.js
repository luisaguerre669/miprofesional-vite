const PLANS = {
  professional: {
    id: 'professional',
    name: 'Plan Profesional',
    price: 5000,
    currency: 'ARS',
    durationDays: 30,
    description: 'Perfil visible en el marketplace con todas las funcionalidades',
    benefits: [
      'Perfil destacado en el marketplace',
      'Acceso a mensajería ilimitada',
      'Estadísticas de perfil',
      'Soporte prioritario'
    ]
  },
  company: {
    id: 'company',
    name: 'Plan Empresa',
    price: 20000,
    currency: 'ARS',
    durationDays: 30,
    description: 'Acceso completo a búsqueda de candidatos y currículums',
    benefits: [
      'Búsqueda avanzada de candidatos',
      'Acceso a currículums completos',
      'Publicación de ofertas laborales',
      'Panel de administración de empresa',
      'Soporte dedicado'
    ]
  }
};

function getPlan(planId) {
  return PLANS[planId] || null;
}

function isValidPlan(planId) {
  return Object.prototype.hasOwnProperty.call(PLANS, planId);
}

module.exports = { PLANS, getPlan, isValidPlan };

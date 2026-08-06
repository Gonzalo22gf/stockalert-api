// Limites por plan
// Cambiar PLANES_HABILITADOS=true en .env para activar validacion
const LIMITES = {
  free:     { productos: 30,       sucursales: 1,  usuarios: 3,  historial: false, excel: false },
  starter:  { productos: 50,       sucursales: 1,  usuarios: 5,  historial: false, excel: true  },
  pro:      { productos: Infinity, sucursales: 10, usuarios: 20, historial: true,  excel: true  },
  business: { productos: Infinity, sucursales: Infinity, usuarios: Infinity, historial: true, excel: true }
};

const TRIAL_DIAS = 15;

function getLimites(plan) {
  return LIMITES[plan] || LIMITES["free"];
}

module.exports = { LIMITES, TRIAL_DIAS, getLimites };

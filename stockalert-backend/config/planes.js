// Limites por plan
// Cambiar PLANES_HABILITADOS=true en .env para activar validacion
const LIMITES = {
  free:     { productos: 30,       sucursales: 1,        usuarios: 3,        historial: false, excel: false },
  starter:  { productos: 100,      sucursales: 1,        usuarios: 5,        historial: false, excel: true  },
  pro:      { productos: 300,      sucursales: 3,        usuarios: 15,       historial: true,  excel: true  },
  business: { productos: Infinity, sucursales: Infinity, usuarios: Infinity, historial: true,  excel: true  }
};
const TRIAL_DIAS = 10;
function getLimites(plan) {
  return LIMITES[plan] || LIMITES["free"];
}
module.exports = { LIMITES, TRIAL_DIAS, getLimites };

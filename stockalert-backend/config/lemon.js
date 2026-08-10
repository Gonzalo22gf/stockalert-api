const { lemonSqueezySetup } = require("@lemonsqueezy/lemonsqueezy.js");

// Feature flag — cuando LEMON_HABILITADO=false, el checkout devuelve "proximamente"
const LEMON_HABILITADO = process.env.LEMON_HABILITADO === "true";

function inicializar() {
  if (!process.env.LEMON_API_KEY) return;
  lemonSqueezySetup({ apiKey: process.env.LEMON_API_KEY });
}

// Mapeo de plan -> variant ID de Lemon Squeezy
const VARIANTES = {
  starter:  process.env.LEMON_VARIANT_STARTER  || "2001100",
  pro:      process.env.LEMON_VARIANT_PRO      || "2001102",
  business: process.env.LEMON_VARIANT_BUSINESS || "2001104"
};

// Mapeo inverso: variant ID -> plan
const VARIANTE_A_PLAN = {
  "2001100": "starter",
  "2001102": "pro",
  "2001104": "business"
};

module.exports = { LEMON_HABILITADO, VARIANTES, VARIANTE_A_PLAN, inicializar };

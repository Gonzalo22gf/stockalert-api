const { createCheckout } = require("@lemonsqueezy/lemonsqueezy.js");
const crypto = require("crypto");
const { inicializar, VARIANTES, VARIANTE_A_PLAN } = require("../config/lemon");
const Empresa = require("../models/Empresa");
const { ValidationError, NotFoundError } = require("../utils/errors/AppError");

inicializar();

const STORE_ID = process.env.LEMON_STORE_ID || "449050";

const LemonService = {
  // Crea una sesion de checkout en Lemon Squeezy
  crearCheckout: async (empresaId, plan, emailAdmin) => {
    const variantId = VARIANTES[plan];
    if (!variantId) throw new ValidationError("Plan invalido: " + plan);

    const empresa = await Empresa.findById(empresaId);
    if (!empresa) throw new NotFoundError("Empresa");

    const { data, error } = await createCheckout(STORE_ID, variantId, {
      checkoutData: {
        email: emailAdmin,
        custom: { empresa_id: empresaId.toString(), plan }
      },
      checkoutOptions: {
        embed: false,
        media: false,
        logo: true
      },
      productOptions: {
        redirectUrl: (process.env.APP_URL || "https://app.mistockalert.com") + "/planes?success=true",
        receiptButtonText: "Volver a StockAlert",
        receiptThankYouNote: "Gracias por suscribirte a StockAlert."
      }
    });

    if (error) throw new ValidationError("Error al crear checkout: " + error.message);
    return { url: data.data.attributes.url };
  },

  // Procesa el webhook de Lemon Squeezy cuando se completa un pago
  procesarWebhook: async (payload, signature, rawBody) => {
    const secreto = process.env.LEMON_WEBHOOK_SECRET;
    if (!secreto) throw new ValidationError("LEMON_WEBHOOK_SECRET no configurado");

    // Verificar firma del webhook
    const hmac = crypto.createHmac("sha256", secreto);
    const digest = hmac.update(rawBody).digest("hex");
    if (digest !== signature) throw new ValidationError("Firma de webhook invalida");

    const evento = payload.meta?.event_name;
    const custom = payload.meta?.custom_data;
    const empresaId = custom?.empresa_id;
    const variantId = payload.data?.attributes?.variant_id?.toString();

    // Solo procesar pagos completados y suscripciones activas
    if (!["order_created", "subscription_created", "subscription_updated"].includes(evento)) {
      return { ignorado: true, evento };
    }

    if (!empresaId || !variantId) return { ignorado: true, razon: "sin empresa_id o variant_id" };

    const plan = VARIANTE_A_PLAN[variantId];
    if (!plan) return { ignorado: true, razon: "variant_id desconocido: " + variantId };

    await Empresa.findByIdAndUpdate(empresaId, {
      plan,
      trialExpira: null // cancelar trial al pagar
    });

    return { ok: true, empresa: empresaId, plan };
  }
};

module.exports = LemonService;

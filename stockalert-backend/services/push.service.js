const admin = require("../config/firebase");
const Suscripcion = require("../models/Suscripcion");

const PushService = {
  // Guarda o actualiza el token de un dispositivo
  suscribir: async (usuarioId, empresaId, token, dispositivo = "web") => {
    await Suscripcion.findOneAndUpdate(
      { token },
      { usuario: usuarioId, empresa: empresaId, token, dispositivo },
      { upsert: true, new: true }
    );
    return { ok: true };
  },

  // Elimina el token de un dispositivo
  desuscribir: async (token) => {
    await Suscripcion.deleteOne({ token });
    return { ok: true };
  },

  // Manda notificacion a todos los dispositivos de un usuario
  notificarUsuario: async (usuarioId, titulo, cuerpo, datos = {}) => {
    const suscripciones = await Suscripcion.find({ usuario: usuarioId }).lean();
    if (!suscripciones.length) return { enviados: 0 };
    const mensajes = suscripciones.map((s) => ({
      token: s.token,
      notification: { title: titulo, body: cuerpo },
      data: datos,
      webpush: { fcmOptions: { link: "https://app.mistockalert.com" } }
    }));
    const resultado = await admin.messaging().sendEach(mensajes);
    // Limpiar tokens invalidos
    const tokensInvalidos = resultado.responses
      .map((r, i) => (!r.success ? suscripciones[i].token : null))
      .filter(Boolean);
    if (tokensInvalidos.length) {
      await Suscripcion.deleteMany({ token: { $in: tokensInvalidos } });
    }
    return { enviados: resultado.successCount, fallidos: resultado.failureCount };
  },

  // Manda notificacion a todos los dispositivos de una empresa
  notificarEmpresa: async (empresaId, titulo, cuerpo, datos = {}) => {
    const suscripciones = await Suscripcion.find({ empresa: empresaId }).lean();
    if (!suscripciones.length) return { enviados: 0 };
    const mensajes = suscripciones.map((s) => ({
      token: s.token,
      notification: { title: titulo, body: cuerpo },
      data: datos,
      webpush: { fcmOptions: { link: "https://app.mistockalert.com" } }
    }));
    const resultado = await admin.messaging().sendEach(mensajes);
    const tokensInvalidos = resultado.responses
      .map((r, i) => (!r.success ? suscripciones[i].token : null))
      .filter(Boolean);
    if (tokensInvalidos.length) {
      await Suscripcion.deleteMany({ token: { $in: tokensInvalidos } });
    }
    return { enviados: resultado.successCount, fallidos: resultado.failureCount };
  }
};

module.exports = PushService;

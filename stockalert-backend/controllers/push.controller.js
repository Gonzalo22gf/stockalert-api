const PushService = require("../services/push.service");

const suscribir = async (req, res, next) => {
  try {
    const { token, dispositivo } = req.body;
    if (!token) return res.status(400).json({ mensaje: "Token requerido" });
    const result = await PushService.suscribir(req.usuario._id, req.empresaId, token, dispositivo);
    res.json(result);
  } catch (e) { next(e); }
};

const desuscribir = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ mensaje: "Token requerido" });
    res.json(await PushService.desuscribir(token));
  } catch (e) { next(e); }
};

module.exports = { suscribir, desuscribir };

const LemonService = require("../services/lemon.service");
const { LEMON_HABILITADO } = require("../config/lemon");

const crearCheckout = async (req, res, next) => {
  try {
    if (!LEMON_HABILITADO) {
      return res.json({ proximamente: true, mensaje: "Los pagos estaran disponibles proximamente." });
    }
    const { plan } = req.body;
    const result = await LemonService.crearCheckout(req.empresaId, plan, req.usuario.email);
    res.json(result);
  } catch (e) { next(e); }
};

const webhook = async (req, res, next) => {
  try {
    const signature = req.headers["x-signature"];
    const result = await LemonService.procesarWebhook(req.body, signature, req.rawBody);
    res.json(result);
  } catch (e) { next(e); }
};

module.exports = { crearCheckout, webhook };

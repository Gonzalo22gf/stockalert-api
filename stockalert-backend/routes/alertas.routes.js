const express = require("express");
const router = express.Router();
const { enviarAlertasDiarias } = require("../controllers/alertas.controller");

// Igual que snapshots: solo el cron (con la clave secreta) puede disparar el envio
function protegerCron(req, res, next) {
  const secreto = req.headers["x-cron-secret"];
  if (!process.env.CRON_SECRET || secreto !== process.env.CRON_SECRET) {
    return res.status(401).json({ mensaje: "No autorizado" });
  }
  next();
}

/**
 * @swagger
 * /api/alertas/enviar-diarias:
 *   post:
 *     summary: Enviar alertas diarias por correo (admin recibe top 10 tiendas en riesgo, cada jefe el parte de su tienda)
 *     description: "Protegido por clave secreta en el header x-cron-secret. Lo dispara un cron automatico de GitHub Actions."
 *     tags: [Alertas]
 *     parameters:
 *       - in: header
 *         name: x-cron-secret
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: "Alertas enviadas (indica cuantos correos salieron)" }
 *       401: { description: "Clave secreta faltante o incorrecta" }
 */
router.post("/enviar-diarias", protegerCron, enviarAlertasDiarias);

module.exports = router;

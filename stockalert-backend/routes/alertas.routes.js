const express = require("express");
const router = express.Router();
const { enviarAlertasDiarias } = require("../controllers/alertas.controller");
const { protegerCron } = require("../middleware/protegerCron");

/**
 * @swagger
 * /api/alertas/enviar-diarias:
 *   post:
 *     summary: Enviar alertas diarias por correo y push (admin y jefes)
 *     description: Protegido por clave secreta en el header x-cron-secret. Lo dispara un cron automatico de GitHub Actions.
 *     tags: [Alertas]
 *     parameters:
 *       - in: header
 *         name: x-cron-secret
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: "Alertas enviadas" }
 *       401: { description: "Clave secreta incorrecta" }
 */
router.post("/enviar-diarias", protegerCron, enviarAlertasDiarias);

module.exports = router;

const express = require("express");
const router = express.Router();
const { protegerRuta } = require("../middleware/auth");
const validar = require("../middleware/validar");
const { z } = require("zod");
const { crearCheckout, webhook } = require("../controllers/lemon.controller");

const checkoutSchema = z.object({
  plan: z.enum(["starter", "pro", "business"], { errorMap: () => ({ message: "Plan invalido" }) })
});

// El webhook no usa JWT — viene de Lemon Squeezy directamente
/**
 * @swagger
 * /api/lemon/webhook:
 *   post:
 *     summary: Webhook de Lemon Squeezy para procesar pagos y activar planes
 *     description: Verificado por firma HMAC en el header x-signature.
 *     tags: [Pagos]
 *     responses:
 *       200: { description: "Evento procesado" }
 *       400: { description: "Firma invalida" }
 */
router.post("/webhook", webhook);
// El checkout requiere estar logueado
/**
 * @swagger
 * /api/lemon/checkout:
 *   post:
 *     summary: Crear sesion de checkout en Lemon Squeezy para upgradar el plan
 *     tags: [Pagos]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [plan]
 *             properties:
 *               plan: { type: string, enum: [starter, pro, business] }
 *     responses:
 *       200: { description: "URL de checkout o mensaje de proximamente" }
 *       400: { description: "Plan invalido" }
 *       401: { description: "No autenticado" }
 */
router.post("/checkout", protegerRuta, validar(checkoutSchema), crearCheckout);

module.exports = router;

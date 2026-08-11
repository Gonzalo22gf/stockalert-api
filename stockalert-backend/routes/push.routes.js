const express = require("express");
const router = express.Router();
const { protegerRuta } = require("../middleware/auth");
const validar = require("../middleware/validar");
const { pushTokenSchema } = require("../validators/index");
const { suscribir, desuscribir } = require("../controllers/push.controller");

/**
 * @swagger
 * tags:
 *   name: Push
 *   description: Notificaciones push via Firebase FCM
 * /api/push/suscribir:
 *   post:
 *     summary: Registrar token de dispositivo para recibir notificaciones push
 *     tags: [Push]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token: { type: string, description: "Token FCM del dispositivo" }
 *               dispositivo: { type: string, example: "web" }
 *     responses:
 *       200: { description: "Token registrado" }
 *       401: { description: "No autenticado" }
 */
router.post("/suscribir", protegerRuta, validar(pushTokenSchema), suscribir);
/**
 * @swagger
 * /api/push/desuscribir:
 *   post:
 *     summary: Eliminar token de dispositivo para dejar de recibir notificaciones push
 *     tags: [Push]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token: { type: string }
 *     responses:
 *       200: { description: "Token eliminado" }
 *       401: { description: "No autenticado" }
 */
router.post("/desuscribir", protegerRuta, validar(pushTokenSchema), desuscribir);

module.exports = router;

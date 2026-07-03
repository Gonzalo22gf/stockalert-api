const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { olvidePassword, restablecerPassword } = require("../controllers/recuperacion.controller");

const limiteRecuperacion = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { mensaje: "Demasiadas solicitudes. Espera 15 minutos." }
});

/**
 * @swagger
 * /api/usuarios/olvide-password:
 *   post:
 *     summary: Solicitar recuperacion de contrasena (envia un correo con el link)
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, example: "usuario@email.com" }
 *     responses:
 *       200: { description: "Respuesta generica (no revela si el email existe)" }
 *       429: { description: "Demasiadas solicitudes" }
 */
router.post("/olvide-password", limiteRecuperacion, olvidePassword);

/**
 * @swagger
 * /api/usuarios/restablecer-password:
 *   post:
 *     summary: Restablecer la contrasena usando el token recibido por correo
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token: { type: string, description: "Token del link del correo" }
 *               password: { type: string, example: "nuevaClave123" }
 *     responses:
 *       200: { description: "Contrasena restablecida" }
 *       400: { description: "Token invalido/vencido o contrasena corta" }
 */
router.post("/restablecer-password", limiteRecuperacion, restablecerPassword);

module.exports = router;

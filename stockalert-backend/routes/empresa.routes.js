const express = require("express");
const router = express.Router();
const { protegerRuta } = require("../middleware/auth");
const { obtenerPerfil } = require("../controllers/empresa.controller");

/**
 * @swagger
 * /api/empresa/perfil:
 *   get:
 *     summary: Obtener nombre y codigo de acceso de la empresa del usuario autenticado
 *     tags: [Empresa]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Perfil de empresa" }
 *       401: { description: "No autenticado" }
 */
router.get("/perfil", protegerRuta, obtenerPerfil);

module.exports = router;

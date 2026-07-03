const express = require("express");
const router = express.Router();
const { protegerRuta } = require("../middleware/auth");
const {
  obtenerMovimientos
} = require("../controllers/movimientos.controller");

/**
 * @swagger
 * tags:
 *   name: Movimientos
 *   description: Historial de auditoría de acciones en el sistema
 */

/**
 * @swagger
 * /api/movimientos:
 *   get:
 *     summary: Listar el historial de movimientos (auditoría)
 *     description: "Devuelve el registro de acciones realizadas en el sistema (altas, bajas, modificaciones de productos, etc.)."
 *     tags: [Movimientos]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Lista de movimientos" }
 *       401: { description: "No autenticado" }
 */
router.get("/", protegerRuta, obtenerMovimientos);

module.exports = router;

const express = require("express");
const router = express.Router();
const {
  obtenerSucursales,
  obtenerResumenSucursales,
  crearSucursal,
  editarSucursal,
  eliminarSucursal
} = require("../controllers/sucursales.controller");
const { protegerRuta, soloAdmin } = require("../middleware/auth");

/**
 * @swagger
 * tags:
 *   name: Sucursales
 *   description: Gestión de sucursales y métricas por tienda
 */

/**
 * @swagger
 * /api/sucursales:
 *   get:
 *     summary: Listar todas las sucursales
 *     tags: [Sucursales]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Lista de sucursales ordenadas por número" }
 *       401: { description: "No autenticado" }
 *   post:
 *     summary: Crear una sucursal (solo admin)
 *     tags: [Sucursales]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [zona, numero]
 *             properties:
 *               zona: { type: number, example: 12 }
 *               numero: { type: number, example: 402 }
 *               direccion: { type: string, example: "Av. Corrientes 1234" }
 *               empresa: { type: string, example: "Carrefour" }
 *     responses:
 *       201: { description: "Sucursal creada" }
 *       400: { description: "Datos inválidos o número duplicado" }
 *       403: { description: "No autorizado" }
 */
router.get("/", protegerRuta, obtenerSucursales);
router.post("/", protegerRuta, soloAdmin, crearSucursal);

/**
 * @swagger
 * /api/sucursales/resumen:
 *   get:
 *     summary: Resumen con métricas por tienda (solo admin)
 *     description: "Devuelve, por cada sucursal: total de productos, vencidos, por vencer (≤7 días), stock crítico, agotados y valor del inventario."
 *     tags: [Sucursales]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Resumen de todas las sucursales" }
 *       403: { description: "No autorizado (requiere rol admin)" }
 */
router.get("/resumen", protegerRuta, obtenerResumenSucursales);

/**
 * @swagger
 * /api/sucursales/{id}:
 *   put:
 *     summary: Editar una sucursal (solo admin)
 *     tags: [Sucursales]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [zona, numero]
 *             properties:
 *               zona: { type: number }
 *               numero: { type: number }
 *               direccion: { type: string }
 *     responses:
 *       200: { description: "Sucursal actualizada" }
 *       404: { description: "Sucursal no encontrada" }
 *   delete:
 *     summary: Eliminar una sucursal y todos sus productos (solo admin)
 *     tags: [Sucursales]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: "Sucursal y productos eliminados" }
 *       403: { description: "No autorizado" }
 *       404: { description: "Sucursal no encontrada" }
 */
router.put("/:id", protegerRuta, soloAdmin, editarSucursal);
router.delete("/:id", protegerRuta, soloAdmin, eliminarSucursal);

module.exports = router;

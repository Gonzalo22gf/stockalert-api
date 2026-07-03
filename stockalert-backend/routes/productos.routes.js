const express = require("express");
const router = express.Router();
const {
  obtenerProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto
} = require("../controllers/productos.controller");
const { protegerRuta } = require("../middleware/auth");

/**
 * @swagger
 * tags:
 *   name: Productos
 *   description: Gestión del inventario de productos
 */

/**
 * @swagger
 * /api/productos:
 *   get:
 *     summary: Listar productos (de la sucursal del usuario, o de todas/una si es admin)
 *     tags: [Productos]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: sucursal
 *         required: false
 *         schema: { type: string }
 *         description: "Solo admin: ID de sucursal para filtrar. Sin este parámetro, un admin ve todas."
 *     responses:
 *       200: { description: "Lista de productos" }
 *       401: { description: "Token faltante o inválido" }
 *   post:
 *     summary: Crear un producto
 *     tags: [Productos]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, categoria, precio, stock, vencimiento]
 *             properties:
 *               nombre: { type: string, example: "Leche entera 1L" }
 *               categoria: { type: string, enum: ["Lácteos", "Bebidas", "Almacén", "Limpieza", "Congelados"], example: "Lácteos" }
 *               precio: { type: number, example: 1200 }
 *               stock: { type: number, example: 24 }
 *               lote: { type: string, example: "L-2026-01" }
 *               vencimiento: { type: string, format: date, example: "2026-08-15" }
 *               codigoBarras: { type: string, example: "7791234567890" }
 *               sucursal: { type: string, description: "Solo admin: ID de la sucursal destino" }
 *     responses:
 *       201: { description: "Producto creado" }
 *       400: { description: "Datos inválidos" }
 *       401: { description: "No autenticado" }
 */
router.get("/", protegerRuta, obtenerProductos);
router.post("/", protegerRuta, crearProducto);

/**
 * @swagger
 * /api/productos/{id}:
 *   put:
 *     summary: Actualizar un producto
 *     tags: [Productos]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ID del producto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre: { type: string }
 *               categoria: { type: string }
 *               precio: { type: number }
 *               stock: { type: number }
 *               lote: { type: string }
 *               vencimiento: { type: string, format: date }
 *     responses:
 *       200: { description: "Producto actualizado" }
 *       404: { description: "Producto no encontrado" }
 *   delete:
 *     summary: Eliminar un producto
 *     tags: [Productos]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: "Producto eliminado" }
 *       404: { description: "Producto no encontrado" }
 */
router.put("/:id", protegerRuta, actualizarProducto);
router.delete("/:id", protegerRuta, eliminarProducto);

module.exports = router;

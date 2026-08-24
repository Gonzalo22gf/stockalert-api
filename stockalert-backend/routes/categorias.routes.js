const express = require("express");
const router = express.Router();
const validar = require("../middleware/validar");
const { categoriaSchema, eliminarCategoriaSchema } = require("../validators/index");
const {
  obtenerCategorias,
  crearCategoria,
  editarCategoria,
  eliminarCategoria
} = require("../controllers/categorias.controller");
const { protegerRuta, soloAdmin } = require("../middleware/auth");

/**
 * @swagger
 * tags:
 *   name: Categorias
 *   description: Gestión de categorías de productos por empresa
 */

/**
 * @swagger
 * /api/categorias:
 *   get:
 *     summary: Listar todas las categorías de la empresa
 *     tags: [Categorias]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Lista de categorías ordenadas por nombre" }
 *       401: { description: "No autenticado" }
 *   post:
 *     summary: Crear una categoría (solo admin)
 *     tags: [Categorias]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre]
 *             properties:
 *               nombre: { type: string, example: "Telas" }
 *     responses:
 *       201: { description: "Categoría creada" }
 *       400: { description: "Datos inválidos" }
 *       409: { description: "Nombre duplicado" }
 */
router.get("/", protegerRuta, obtenerCategorias);
router.post("/", validar(categoriaSchema), protegerRuta, soloAdmin, crearCategoria);

/**
 * @swagger
 * /api/categorias/{id}:
 *   put:
 *     summary: Editar (renombrar) una categoría (solo admin)
 *     tags: [Categorias]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: "Categoría actualizada" }
 *       404: { description: "Categoría no encontrada" }
 *       409: { description: "Nombre duplicado" }
 *   delete:
 *     summary: Eliminar una categoría, reasignando sus productos si los tiene (solo admin)
 *     tags: [Categorias]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reasignarA: { type: string, example: "Otros" }
 *     responses:
 *       200: { description: "Categoría eliminada" }
 *       400: { description: "Tiene productos y falta indicar reasignación" }
 *       404: { description: "Categoría no encontrada" }
 */
router.put("/:id", validar(categoriaSchema), protegerRuta, soloAdmin, editarCategoria);
router.delete("/:id", validar(eliminarCategoriaSchema), protegerRuta, soloAdmin, eliminarCategoria);

module.exports = router;

const express = require("express");
const router = express.Router();
const validar = require("../middleware/validar");
const { linkSchema } = require("../validators/index");
const { protegerRuta } = require("../middleware/auth");
const { listarLinks, crearLink, editarLink, borrarLink } = require("../controllers/links.controller");

/**
 * @swagger
 * tags:
 *   name: Links
 *   description: Links frecuentes de la empresa
 * /api/links:
 *   get:
 *     summary: Listar links frecuentes de la empresa
 *     tags: [Links]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Lista de links" }
 *       401: { description: "No autenticado" }
 *   post:
 *     summary: Crear un link frecuente (solo admin)
 *     tags: [Links]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, url]
 *             properties:
 *               nombre: { type: string, example: "Sistema de turnos" }
 *               url: { type: string, example: "https://ejemplo.com" }
 *     responses:
 *       201: { description: "Link creado" }
 *       400: { description: "Datos invalidos" }
 *       403: { description: "No autorizado" }
 */
router.get("/", protegerRuta, listarLinks);
router.post("/", protegerRuta, validar(linkSchema), crearLink);
router.put("/:id", protegerRuta, validar(linkSchema), editarLink);
router.delete("/:id", protegerRuta, borrarLink);

module.exports = router;

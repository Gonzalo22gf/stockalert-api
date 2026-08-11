const express = require("express");
const router = express.Router();
const { protegerRuta } = require("../middleware/auth");
const { soloFundador } = require("../middleware/soloFundador");
const { obtenerMetricas, listarEmpresas, toggleActiva, eliminarEmpresa } = require("../controllers/superadmin.controller");

// Todas las rutas requieren JWT valido + ser fundador
router.use(protegerRuta, soloFundador);

/**
 * @swagger
 * tags:
 *   name: Superadmin
 *   description: Panel exclusivo del fundador
 * /api/superadmin/metricas:
 *   get:
 *     summary: Metricas globales de toda la plataforma (solo fundador)
 *     tags: [Superadmin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Metricas: empresas, usuarios, productos, sucursales" }
 *       403: { description: "No autorizado" }
 */
router.get("/metricas", obtenerMetricas);
/**
 * @swagger
 * /api/superadmin/empresas:
 *   get:
 *     summary: Listar todas las empresas con sus metricas (solo fundador)
 *     tags: [Superadmin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Lista de empresas con usuarios, sucursales y productos" }
 *       403: { description: "No autorizado" }
 */
router.get("/empresas", listarEmpresas);
/**
 * @swagger
 * /api/superadmin/empresas/{id}/toggle:
 *   patch:
 *     summary: Activar o desactivar una empresa (solo fundador)
 *     tags: [Superadmin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: "Estado actualizado" }
 *       404: { description: "Empresa no encontrada" }
 */
router.patch("/empresas/:id/toggle", toggleActiva);
/**
 * @swagger
 * /api/superadmin/empresas/{id}:
 *   delete:
 *     summary: Eliminar empresa y todos sus datos (solo fundador, irreversible)
 *     tags: [Superadmin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: "Empresa eliminada" }
 *       404: { description: "Empresa no encontrada" }
 */
router.delete("/empresas/:id", eliminarEmpresa);

module.exports = router;

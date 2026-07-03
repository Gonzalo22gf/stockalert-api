const express = require("express");
const router = express.Router();
const {
  generarSnapshot,
  obtenerHistorico
} = require("../controllers/snapshots.controller");
const { protegerRuta, soloAdmin } = require("../middleware/auth");

// Middleware: protege el endpoint de generación con una clave secreta.
// Lo usa el GitHub Action automático (no hay usuario logueado), enviando
// el header "x-cron-secret". Solo quien tenga el secreto puede disparar el snapshot.
function protegerCron(req, res, next) {
  const secreto = req.headers["x-cron-secret"];
  if (!process.env.CRON_SECRET || secreto !== process.env.CRON_SECRET) {
    return res.status(401).json({ mensaje: "No autorizado" });
  }
  next();
}

/**
 * @swagger
 * tags:
 *   name: Snapshots
 *   description: Histórico diario del estado de las tiendas (reportes)
 */

/**
 * @swagger
 * /api/snapshots/generar:
 *   post:
 *     summary: Generar el snapshot del día (lo dispara un cron automático)
 *     description: "Guarda una foto del estado de todas las sucursales (totales y desglose por categoría). Idempotente: si ya existe el snapshot del día, lo actualiza. Protegido por clave secreta en el header x-cron-secret (no usa JWT)."
 *     tags: [Snapshots]
 *     parameters:
 *       - in: header
 *         name: x-cron-secret
 *         required: true
 *         schema: { type: string }
 *         description: Clave secreta del cron (variable de entorno CRON_SECRET)
 *     responses:
 *       200: { description: "Snapshot generado o actualizado" }
 *       401: { description: "Clave secreta faltante o incorrecta" }
 */
router.post("/generar", protegerCron, generarSnapshot);

/**
 * @swagger
 * /api/snapshots/historico:
 *   get:
 *     summary: Consultar el histórico de snapshots por rango de fechas (solo admin)
 *     tags: [Snapshots]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: desde
 *         required: false
 *         schema: { type: string, format: date }
 *         description: "Fecha inicial (YYYY-MM-DD)"
 *       - in: query
 *         name: hasta
 *         required: false
 *         schema: { type: string, format: date }
 *         description: "Fecha final (YYYY-MM-DD)"
 *     responses:
 *       200: { description: "Lista de snapshots ordenados por fecha ascendente" }
 *       403: { description: "No autorizado (requiere rol admin)" }
 */
router.get("/historico", protegerRuta, soloAdmin, obtenerHistorico);

module.exports = router;

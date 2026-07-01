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

// GENERAR snapshot del día — protegido por clave secreta (lo dispara el cron automático)
router.post("/generar", protegerCron, generarSnapshot);

// CONSULTAR histórico — protegido por login de admin (lo usa el frontend)
router.get("/historico", protegerRuta, soloAdmin, obtenerHistorico);

module.exports = router;

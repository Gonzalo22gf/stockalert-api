const express = require("express");
const router = express.Router();
const { protegerRuta } = require("../middleware/auth");
const { soloFundador } = require("../middleware/soloFundador");
const { obtenerMetricas, listarEmpresas } = require("../controllers/superadmin.controller");

// Todas las rutas requieren JWT valido + ser fundador
router.use(protegerRuta, soloFundador);

router.get("/metricas", obtenerMetricas);
router.get("/empresas", listarEmpresas);

module.exports = router;

const express = require("express");
const router = express.Router();

const {
  obtenerSucursales,
  obtenerResumenSucursales
} = require("../controllers/sucursales.controller");

const protegerRuta = require("../middleware/auth");

router.get("/", protegerRuta, obtenerSucursales);

router.get(
  "/resumen",
  protegerRuta,
  obtenerResumenSucursales
);

module.exports = router;
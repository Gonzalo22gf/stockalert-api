const express = require("express");
const router = express.Router();

const {
  obtenerSucursales,
  obtenerResumenSucursales,
  editarSucursal
} = require("../controllers/sucursales.controller");

const { protegerRuta, soloAdmin } = require("../middleware/auth");

router.get("/",        protegerRuta, obtenerSucursales);
router.get("/resumen", protegerRuta, obtenerResumenSucursales);
router.put("/:id",     protegerRuta, soloAdmin, editarSucursal);

module.exports = router;
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

router.get("/",        protegerRuta, obtenerSucursales);
router.get("/resumen", protegerRuta, obtenerResumenSucursales);
router.post("/",       protegerRuta, soloAdmin, crearSucursal);
router.put("/:id",     protegerRuta, soloAdmin, editarSucursal);
router.delete("/:id",  protegerRuta, soloAdmin, eliminarSucursal);

module.exports = router;
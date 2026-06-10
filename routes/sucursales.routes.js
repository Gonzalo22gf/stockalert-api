const express = require("express");
const router = express.Router();

const { obtenerSucursales } = require("../controllers/sucursales.controller");
const protegerRuta = require("../middleware/auth");

router.get("/", protegerRuta, obtenerSucursales);

module.exports = router;
const express = require("express");
const router = express.Router();

const protegerRuta = require("../middleware/auth");

const {
  obtenerMovimientos
} = require("../controllers/movimientos.controller");

router.get("/", protegerRuta, obtenerMovimientos);

module.exports = router;
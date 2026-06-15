const express = require("express");
const router = express.Router();

const {
  obtenerProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto
} = require("../controllers/productos.controller");

const { protegerRuta } = require("../middleware/auth");

router.get("/",    protegerRuta, obtenerProductos);
router.post("/",   protegerRuta, crearProducto);
router.put("/:id", protegerRuta, actualizarProducto);
router.delete("/:id", protegerRuta, eliminarProducto);

module.exports = router;
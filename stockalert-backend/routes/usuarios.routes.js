const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const {
  registrarUsuario,
  loginUsuario,
  obtenerPerfil,
  listarUsuarios,
  cambiarRol,
  cambiarEstado,
  cambiarSucursal,
  editarUsuarioAdmin,
  eliminarUsuario
} = require("../controllers/usuarios.controller");

const { protegerRuta, soloAdmin } = require("../middleware/auth");

// Rate limit estricto SOLO para login/registro (anti fuerza bruta)
const limiteAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { mensaje: "Demasiados intentos de acceso. Esperá 15 minutos." }
});

// Públicas (con límite anti fuerza bruta)
router.post("/registro", limiteAuth, registrarUsuario);
router.post("/login",    limiteAuth, loginUsuario);

// Protegidas
router.get("/perfil", protegerRuta, obtenerPerfil);

// Solo admin
router.get("/",               protegerRuta, soloAdmin, listarUsuarios);
router.put("/:id/rol",        protegerRuta, soloAdmin, cambiarRol);
router.put("/:id/estado",     protegerRuta, soloAdmin, cambiarEstado);
router.put("/:id/sucursal",   protegerRuta, soloAdmin, cambiarSucursal);
router.put("/:id",            protegerRuta, soloAdmin, editarUsuarioAdmin);
router.delete("/:id",         protegerRuta, soloAdmin, eliminarUsuario);

module.exports = router;
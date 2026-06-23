const express = require("express");
const router = express.Router();

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

// Públicas
router.post("/registro", registrarUsuario);
router.post("/login",    loginUsuario);

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
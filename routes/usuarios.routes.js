const express = require("express");
const router = express.Router();

const {
  registrarUsuario,
  loginUsuario,
  obtenerPerfil
} = require("../controllers/usuarios.controller");

const protegerRuta = require("../middleware/auth");

router.post("/registro", registrarUsuario);
router.post("/login", loginUsuario);
router.get("/perfil", protegerRuta, obtenerPerfil);

module.exports = router;
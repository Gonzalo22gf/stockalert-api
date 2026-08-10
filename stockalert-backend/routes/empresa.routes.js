const express = require("express");
const router = express.Router();
const { protegerRuta } = require("../middleware/auth");
const { obtenerPerfil } = require("../controllers/empresa.controller");

router.get("/perfil", protegerRuta, obtenerPerfil);

module.exports = router;

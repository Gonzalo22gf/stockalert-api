const express = require("express");
const router = express.Router();
const { protegerRuta, soloAdmin } = require("../middleware/auth");
const Empresa = require("../models/Empresa");

// Ver perfil de la empresa (nombre + codigo de acceso)
router.get("/perfil", protegerRuta, async (req, res) => {
  try {
    const empresa = await Empresa.findById(req.empresaId).select("nombre codigoAcceso createdAt");
    if (!empresa) return res.status(404).json({ mensaje: "Empresa no encontrada" });
    res.json(empresa);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener perfil de empresa" });
  }
});

module.exports = router;

const Empresa = require("../models/Empresa");

const obtenerPerfil = async (req, res, next) => {
  try {
    const empresa = await Empresa.findById(req.empresaId).select("nombre codigoAcceso createdAt");
    if (!empresa) return res.status(404).json({ mensaje: "Empresa no encontrada" });
    res.json(empresa);
  } catch (error) { next(error); }
};

module.exports = { obtenerPerfil };

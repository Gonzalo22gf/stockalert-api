const logger = require("../utils/logger");
const LinkFrecuente = require("../models/LinkFrecuente");

// LISTAR links de la empresa
const listarLinks = async (req, res) => {
  try {
    const links = await LinkFrecuente.find({ empresa: req.empresaId }).sort({ orden: 1, createdAt: 1 });
    res.json(links);
  } catch (error) {
    logger.error("ERROR LISTAR LINKS:", error);
    res.status(500).json({ mensaje: "Error al listar links" });
  }
};

// CREAR link
const crearLink = async (req, res) => {
  try {
    const { nombre, url } = req.body;
    if (!nombre || !url) {
      return res.status(400).json({ mensaje: "Nombre y URL son obligatorios" });
    }
    const cantidad = await LinkFrecuente.countDocuments({ empresa: req.empresaId });
    if (cantidad >= 10) {
      return res.status(400).json({ mensaje: "Maximo 10 links por empresa" });
    }
    const link = await LinkFrecuente.create({ nombre, url, empresa: req.empresaId, orden: cantidad });
    res.status(201).json(link);
  } catch (error) {
    logger.error("ERROR CREAR LINK:", error);
    res.status(500).json({ mensaje: "Error al crear link" });
  }
};

// EDITAR link
const editarLink = async (req, res) => {
  try {
    const { nombre, url } = req.body;
    const link = await LinkFrecuente.findOne({ _id: req.params.id, empresa: req.empresaId });
    if (!link) return res.status(404).json({ mensaje: "Link no encontrado" });
    if (nombre) link.nombre = nombre.trim();
    if (url) link.url = url.trim();
    await link.save();
    res.json(link);
  } catch (error) {
    logger.error("ERROR EDITAR LINK:", error);
    res.status(500).json({ mensaje: "Error al editar link" });
  }
};

// BORRAR link
const borrarLink = async (req, res) => {
  try {
    const link = await LinkFrecuente.findOne({ _id: req.params.id, empresa: req.empresaId });
    if (!link) return res.status(404).json({ mensaje: "Link no encontrado" });
    await LinkFrecuente.findByIdAndDelete(link._id);
    res.json({ mensaje: "Link eliminado" });
  } catch (error) {
    logger.error("ERROR BORRAR LINK:", error);
    res.status(500).json({ mensaje: "Error al borrar link" });
  }
};

module.exports = { listarLinks, crearLink, editarLink, borrarLink };

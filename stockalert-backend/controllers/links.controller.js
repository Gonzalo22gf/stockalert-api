const logger = require("../utils/logger");
const LinkFrecuente = require("../models/LinkFrecuente");
const { NotFoundError, ValidationError } = require("../utils/errors/AppError");

const listarLinks = async (req, res, next) => {
  try {
    const links = await LinkFrecuente.find({ empresa: req.empresaId }).sort({ orden: 1, createdAt: 1 });
    res.json(links);
  } catch (error) {
    next(error);
  }
};

const crearLink = async (req, res, next) => {
  try {
    const { nombre, url } = req.body;
    if (!nombre || !url) throw new ValidationError("Nombre y URL son obligatorios");
    const cantidad = await LinkFrecuente.countDocuments({ empresa: req.empresaId });
    if (cantidad >= 10) throw new ValidationError("Maximo 10 links por empresa");
    const link = await LinkFrecuente.create({ nombre, url, empresa: req.empresaId, orden: cantidad });
    res.status(201).json(link);
  } catch (error) {
    next(error);
  }
};

const editarLink = async (req, res, next) => {
  try {
    const { nombre, url } = req.body;
    const link = await LinkFrecuente.findOne({ _id: req.params.id, empresa: req.empresaId });
    if (!link) throw new NotFoundError("Link");
    if (nombre) link.nombre = nombre.trim();
    if (url) link.url = url.trim();
    await link.save();
    res.json(link);
  } catch (error) {
    next(error);
  }
};

const borrarLink = async (req, res, next) => {
  try {
    const link = await LinkFrecuente.findOne({ _id: req.params.id, empresa: req.empresaId });
    if (!link) throw new NotFoundError("Link");
    await LinkFrecuente.findByIdAndDelete(link._id);
    res.json({ mensaje: "Link eliminado" });
  } catch (error) {
    next(error);
  }
};

module.exports = { listarLinks, crearLink, editarLink, borrarLink };

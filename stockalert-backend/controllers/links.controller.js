const logger = require("../utils/logger");
const LinkRepository = require("../repositories/link.repository");
const { NotFoundError, ValidationError } = require("../utils/errors/AppError");

const listarLinks = async (req, res, next) => {
  try {
    const links = await LinkRepository.findByEmpresa(req.empresaId);
    res.json(links);
  } catch (error) {
    next(error);
  }
};

const crearLink = async (req, res, next) => {
  try {
    const { nombre, url } = req.body;
    const cantidad = await LinkRepository.count(req.empresaId);
    if (cantidad >= 10) throw new ValidationError("Maximo 10 links por empresa");
    const link = await LinkRepository.create({ nombre, url, empresa: req.empresaId, orden: cantidad });
    res.status(201).json(link);
  } catch (error) {
    next(error);
  }
};

const editarLink = async (req, res, next) => {
  try {
    const { nombre, url } = req.body;
    const link = await LinkRepository.findById(req.params.id, req.empresaId);
    if (!link) throw new NotFoundError("Link");
    if (nombre) link.nombre = nombre.trim();
    if (url) link.url = url.trim();
    await LinkRepository.save(link);
    res.json(link);
  } catch (error) {
    next(error);
  }
};

const borrarLink = async (req, res, next) => {
  try {
    const link = await LinkRepository.findById(req.params.id, req.empresaId);
    if (!link) throw new NotFoundError("Link");
    await LinkRepository.delete(link._id);
    res.json({ mensaje: "Link eliminado" });
  } catch (error) {
    next(error);
  }
};

module.exports = { listarLinks, crearLink, editarLink, borrarLink };

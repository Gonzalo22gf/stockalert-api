const LinkService = require("../services/link.service");

const listarLinks = async (req, res, next) => {
  try { res.json(await LinkService.listar(req.empresaId)); } catch (e) { next(e); }
};
const crearLink = async (req, res, next) => {
  try { res.status(201).json(await LinkService.crear(req.empresaId, req.body)); } catch (e) { next(e); }
};
const editarLink = async (req, res, next) => {
  try { res.json(await LinkService.editar(req.params.id, req.empresaId, req.body)); } catch (e) { next(e); }
};
const borrarLink = async (req, res, next) => {
  try { res.json(await LinkService.borrar(req.params.id, req.empresaId)); } catch (e) { next(e); }
};
module.exports = { listarLinks, crearLink, editarLink, borrarLink };

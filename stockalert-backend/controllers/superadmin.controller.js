const SuperadminService = require("../services/superadmin.service");

const obtenerMetricas = async (req, res, next) => {
  try { res.json(await SuperadminService.metricas()); } catch (e) { next(e); }
};

const listarEmpresas = async (req, res, next) => {
  try { res.json(await SuperadminService.listarEmpresas()); } catch (e) { next(e); }
};

const toggleActiva = async (req, res, next) => {
  try { res.json(await SuperadminService.toggleActiva(req.params.id)); } catch (e) { next(e); }
};

const eliminarEmpresa = async (req, res, next) => {
  try { res.json(await SuperadminService.eliminarTodo(req.params.id)); } catch (e) { next(e); }
};

module.exports = { obtenerMetricas, listarEmpresas, toggleActiva, eliminarEmpresa };

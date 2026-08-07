const SuperadminService = require("../services/superadmin.service");

const obtenerMetricas = async (req, res, next) => {
  try { res.json(await SuperadminService.metricas()); } catch (e) { next(e); }
};

const listarEmpresas = async (req, res, next) => {
  try { res.json(await SuperadminService.listarEmpresas()); } catch (e) { next(e); }
};

module.exports = { obtenerMetricas, listarEmpresas };

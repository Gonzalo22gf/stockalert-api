const logger = require("../utils/logger");
const Empresa = require("../models/Empresa");
const { guardarSnapshot, obtenerSnapshotsPorFiltro } = require("../services/snapshot.service");
const { ForbiddenError } = require("../utils/errors/AppError");

const generarSnapshot = async (req, res, next) => {
  try {
    const empresas = await Empresa.find({ activa: true });
    const resultados = await Promise.all(empresas.map((e) => guardarSnapshot(e._id, e.nombre)));
    res.json({ mensaje: "Snapshots generados", resultados });
  } catch (error) { next(error); }
};

const obtenerHistorico = async (req, res, next) => {
  try {
    if (req.usuario.rol !== "admin") throw new ForbiddenError();
    const snapshots = await obtenerSnapshotsPorFiltro(req.empresaId, req.query);
    res.json(snapshots);
  } catch (error) { next(error); }
};

module.exports = { generarSnapshot, obtenerHistorico };

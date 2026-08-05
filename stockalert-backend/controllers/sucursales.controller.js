const SucursalService = require("../services/sucursal.service");
const { ForbiddenError } = require("../utils/errors/AppError");

const obtenerSucursales = async (req, res, next) => {
  try { res.json(await SucursalService.listar(req.empresaId)); } catch (e) { next(e); }
};
const obtenerResumenSucursales = async (req, res, next) => {
  try {
    if (req.usuario.rol !== "admin") throw new ForbiddenError();
    res.json(await SucursalService.resumen(req.empresaId));
  } catch (e) { next(e); }
};
const crearSucursal = async (req, res, next) => {
  try {
    const sucursal = await SucursalService.crear(req.empresaId, req.body);
    res.status(201).json({ mensaje: "Sucursal creada", sucursal });
  } catch (e) { next(e); }
};
const editarSucursal = async (req, res, next) => {
  try {
    const sucursal = await SucursalService.editar(req.params.id, req.empresaId, req.body);
    res.json({ mensaje: "Sucursal actualizada", sucursal });
  } catch (e) { next(e); }
};
const eliminarSucursal = async (req, res, next) => {
  try {
    if (req.usuario.rol !== "admin") throw new ForbiddenError();
    res.json(await SucursalService.eliminar(req.params.id, req.empresaId));
  } catch (e) { next(e); }
};
module.exports = { obtenerSucursales, obtenerResumenSucursales, crearSucursal, editarSucursal, eliminarSucursal };

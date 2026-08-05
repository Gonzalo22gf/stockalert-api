const ProductoService = require("../services/producto.service");

const obtenerProductos = async (req, res, next) => {
  try {
    const filtros = {};
    if (req.usuario.rol === "admin") { if (req.query.sucursal) filtros.sucursal = req.query.sucursal; }
    else { filtros.sucursal = req.usuario.sucursal?._id || req.usuario.sucursal; }
    res.json(await ProductoService.listar(req.empresaId, filtros));
  } catch (e) { next(e); }
};
const crearProducto = async (req, res, next) => {
  try { res.status(201).json(await ProductoService.crear(req.empresaId, req.usuario, req.body)); } catch (e) { next(e); }
};
const actualizarProducto = async (req, res, next) => {
  try { res.json(await ProductoService.actualizar(req.params.id, req.empresaId, req.usuario, req.body)); } catch (e) { next(e); }
};
const eliminarProducto = async (req, res, next) => {
  try { res.json(await ProductoService.eliminar(req.params.id, req.empresaId, req.usuario)); } catch (e) { next(e); }
};
module.exports = { obtenerProductos, crearProducto, actualizarProducto, eliminarProducto };

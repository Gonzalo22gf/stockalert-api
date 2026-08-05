const logger = require("../utils/logger");
const SucursalRepository = require("../repositories/sucursal.repository");
const ProductoRepository = require("../repositories/producto.repository");
const { NotFoundError, ValidationError, ForbiddenError } = require("../utils/errors/AppError");

const obtenerSucursales = async (req, res, next) => {
  try {
    const sucursales = await SucursalRepository.findByEmpresa(req.empresaId);
    res.json(sucursales);
  } catch (error) {
    next(error);
  }
};

const obtenerResumenSucursales = async (req, res, next) => {
  try {
    if (req.usuario.rol !== "admin") throw new ForbiddenError();
    const sucursales = await SucursalRepository.findByEmpresa(req.empresaId);
    const hoy = new Date();
    const resumen = await Promise.all(
      sucursales.map(async (sucursal) => {
        const productos = await ProductoRepository.findByEmpresa(req.empresaId, { sucursal: sucursal._id });
        const totalProductos = productos.length;
        const vencidos = productos.filter((p) => new Date(p.vencimiento) < hoy).length;
        const porVencer = productos.filter((p) => {
          const diff = Math.ceil((new Date(p.vencimiento) - hoy) / (1000 * 60 * 60 * 24));
          return diff >= 0 && diff <= 7;
        }).length;
        const stockCritico = productos.filter((p) => p.stock > 0 && p.stock <= 5).length;
        const agotados = productos.filter((p) => p.stock === 0).length;
        const valorInventario = productos.reduce((t, p) => t + p.stock * p.precio, 0);
        return { sucursal: { _id: sucursal._id, zona: sucursal.zona, numero: sucursal.numero, nombre: sucursal.nombre, direccion: sucursal.direccion, empresa: sucursal.empresa }, totalProductos, vencidos, porVencer, stockCritico, agotados, valorInventario };
      })
    );
    res.json(resumen);
  } catch (error) {
    next(error);
  }
};

const crearSucursal = async (req, res, next) => {
  try {
    const { zona, numero, direccion } = req.body;
    const yaExiste = await SucursalRepository.findByNumero(numero, req.empresaId);
    if (yaExiste) throw new ValidationError("Ya existe una sucursal con ese numero en tu empresa");
    const sucursal = await SucursalRepository.create({ zona: Number(zona), numero: Number(numero), direccion: direccion?.trim() || "", empresa: req.empresaId });
    res.status(201).json({ mensaje: "Sucursal creada", sucursal });
  } catch (error) {
    next(error);
  }
};

const editarSucursal = async (req, res, next) => {
  try {
    const { zona, numero, direccion } = req.body;
    const existente = await SucursalRepository.findById(req.params.id, req.empresaId);
    if (!existente) throw new NotFoundError("Sucursal");
    if (Number(numero) !== existente.numero) {
      const choque = await SucursalRepository.findByNumero(numero, req.empresaId);
      if (choque && choque._id.toString() !== existente._id.toString()) throw new ValidationError("Ya existe otra sucursal con ese numero");
    }
    existente.zona = Number(zona);
    existente.numero = Number(numero);
    existente.direccion = direccion?.trim() || "";
    await SucursalRepository.save(existente);
    res.json({ mensaje: "Sucursal actualizada", sucursal: existente });
  } catch (error) {
    next(error);
  }
};

const eliminarSucursal = async (req, res, next) => {
  try {
    if (req.usuario.rol !== "admin") throw new ForbiddenError();
    const sucursal = await SucursalRepository.findById(req.params.id, req.empresaId);
    if (!sucursal) throw new NotFoundError("Sucursal");
    const Producto = require("../models/Producto");
    const resultadoProductos = await Producto.deleteMany({ sucursal: sucursal._id, empresa: req.empresaId });
    await SucursalRepository.delete(sucursal._id);
    res.json({ mensaje: "Sucursal eliminada", productosEliminados: resultadoProductos.deletedCount });
  } catch (error) {
    next(error);
  }
};

module.exports = { obtenerSucursales, obtenerResumenSucursales, crearSucursal, editarSucursal, eliminarSucursal };

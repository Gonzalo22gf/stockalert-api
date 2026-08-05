const logger = require("../utils/logger");
const Sucursal = require("../models/Sucursal");
const Producto = require("../models/Producto");
const { NotFoundError, ValidationError, ForbiddenError } = require("../utils/errors/AppError");

const obtenerSucursales = async (req, res, next) => {
  try {
    const sucursales = await Sucursal.find({ empresa: req.empresaId }).sort({ numero: 1 });
    res.json(sucursales);
  } catch (error) {
    next(error);
  }
};

const obtenerResumenSucursales = async (req, res, next) => {
  try {
    if (req.usuario.rol !== "admin") throw new ForbiddenError();
    const sucursales = await Sucursal.find({ empresa: req.empresaId }).sort({ numero: 1 });
    const hoy = new Date();
    const resumen = await Promise.all(
      sucursales.map(async (sucursal) => {
        const productos = await Producto.find({ sucursal: sucursal._id, empresa: req.empresaId });
        const totalProductos = productos.length;
        const vencidos = productos.filter((p) => new Date(p.vencimiento) < hoy).length;
        const porVencer = productos.filter((p) => {
          const diff = Math.ceil((new Date(p.vencimiento) - hoy) / (1000 * 60 * 60 * 24));
          return diff >= 0 && diff <= 7;
        }).length;
        const stockCritico = productos.filter((p) => p.stock > 0 && p.stock <= 5).length;
        const agotados = productos.filter((p) => p.stock === 0).length;
        const valorInventario = productos.reduce((t, p) => t + p.stock * p.precio, 0);
        return {
          sucursal: { _id: sucursal._id, zona: sucursal.zona, numero: sucursal.numero, nombre: sucursal.nombre, direccion: sucursal.direccion, empresa: sucursal.empresa },
          totalProductos, vencidos, porVencer, stockCritico, agotados, valorInventario
        };
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
    if (zona === undefined || zona === null || numero === undefined || numero === null) {
      throw new ValidationError("Zona y numero son obligatorios");
    }
    const yaExiste = await Sucursal.findOne({ numero: Number(numero), empresa: req.empresaId });
    if (yaExiste) throw new ValidationError("Ya existe una sucursal con ese numero en tu empresa");
    const sucursal = await Sucursal.create({ zona: Number(zona), numero: Number(numero), direccion: direccion?.trim() || "", empresa: req.empresaId });
    res.status(201).json({ mensaje: "Sucursal creada", sucursal });
  } catch (error) {
    next(error);
  }
};

const editarSucursal = async (req, res, next) => {
  try {
    const { zona, numero, direccion } = req.body;
    if (zona === undefined || zona === null || numero === undefined || numero === null) {
      throw new ValidationError("Zona y numero son obligatorios");
    }
    const existente = await Sucursal.findOne({ _id: req.params.id, empresa: req.empresaId });
    if (!existente) throw new NotFoundError("Sucursal");
    if (Number(numero) !== existente.numero) {
      const choque = await Sucursal.findOne({ numero: Number(numero), empresa: req.empresaId, _id: { $ne: existente._id } });
      if (choque) throw new ValidationError("Ya existe otra sucursal con ese numero en tu empresa");
    }
    existente.zona = Number(zona);
    existente.numero = Number(numero);
    existente.direccion = direccion?.trim() || "";
    await existente.save();
    res.json({ mensaje: "Sucursal actualizada", sucursal: existente });
  } catch (error) {
    next(error);
  }
};

const eliminarSucursal = async (req, res, next) => {
  try {
    if (req.usuario.rol !== "admin") throw new ForbiddenError();
    const sucursal = await Sucursal.findOne({ _id: req.params.id, empresa: req.empresaId });
    if (!sucursal) throw new NotFoundError("Sucursal");
    const resultadoProductos = await Producto.deleteMany({ sucursal: sucursal._id, empresa: req.empresaId });
    await Sucursal.findByIdAndDelete(sucursal._id);
    res.json({ mensaje: "Sucursal eliminada", productosEliminados: resultadoProductos.deletedCount });
  } catch (error) {
    next(error);
  }
};

module.exports = { obtenerSucursales, obtenerResumenSucursales, crearSucursal, editarSucursal, eliminarSucursal };

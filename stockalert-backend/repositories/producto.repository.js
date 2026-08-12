const Producto = require("../models/Producto");
const Movimiento = require("../models/Movimiento");

const populate = "sucursal zona numero direccion empresa";

const ProductoRepository = {
  findByEmpresa: (empresaId, filtrosExtra = {}) =>
    Producto.find({ empresa: empresaId, ...filtrosExtra })
      .populate("sucursal", populate)
      .populate("creadoPor", "nombre email rol")
      .populate("actualizadoPor", "nombre email rol")
      .sort({ createdAt: -1 }),

  findById: (id, empresaId) =>
    Producto.findOne({ _id: id, empresa: empresaId }),

  create: (datos) => Producto.create(datos),

  update: (id, datos) =>
    Producto.findByIdAndUpdate(id, datos, { new: true, runValidators: true })
      .populate("sucursal", populate)
      .populate("creadoPor", "nombre email rol")
      .populate("actualizadoPor", "nombre email rol"),

  delete: (id) => Producto.findByIdAndDelete(id),

  encontrarPorIds: (ids, empresaId) =>
    Producto.find({ _id: { $in: ids }, empresa: empresaId }),

  registrarMovimiento: (datos) => Movimiento.create(datos)
};

module.exports = ProductoRepository;

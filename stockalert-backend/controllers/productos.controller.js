const logger = require("../utils/logger");
const Producto = require("../models/Producto");
const Movimiento = require("../models/Movimiento");
const Sucursal = require("../models/Sucursal");
const { NotFoundError, ValidationError, ForbiddenError } = require("../utils/errors/AppError");

function prepararLotes({ lotes, lote, stock, vencimiento }) {
  if (Array.isArray(lotes) && lotes.length > 0) {
    return lotes.map((item) => ({ numero: item.numero || item.lote || "", stock: Number(item.stock || 0), vencimiento: item.vencimiento }));
  }
  return [{ numero: lote || "", stock: Number(stock || 0), vencimiento }];
}
function calcularStockTotal(lotes) {
  if (!Array.isArray(lotes) || lotes.length === 0) return 0;
  return lotes.reduce((total, lote) => total + Number(lote.stock || 0), 0);
}
function obtenerProximoVencimiento(lotes, fallback) {
  if (!Array.isArray(lotes) || lotes.length === 0) return fallback;
  const ordenados = [...lotes].filter((l) => l.vencimiento).sort((a, b) => new Date(a.vencimiento) - new Date(b.vencimiento));
  return ordenados[0]?.vencimiento || fallback;
}
function obtenerLotePrincipal(lotes, fallback) {
  if (!Array.isArray(lotes) || lotes.length === 0) return fallback || "";
  return lotes[0].numero || "";
}

const obtenerProductos = async (req, res, next) => {
  try {
    let filtro = { empresa: req.empresaId };
    if (req.usuario.rol === "admin") {
      if (req.query.sucursal) filtro.sucursal = req.query.sucursal;
    } else {
      filtro.sucursal = req.usuario.sucursal?._id || req.usuario.sucursal;
    }
    const productos = await Producto.find(filtro)
      .populate("sucursal", "zona numero direccion empresa")
      .populate("creadoPor", "nombre email rol")
      .populate("actualizadoPor", "nombre email rol")
      .sort({ createdAt: -1 });
    res.json(productos);
  } catch (error) {
    next(error);
  }
};

const crearProducto = async (req, res, next) => {
  try {
    const { nombre, categoria, stock, precio, vencimiento, codigoBarras, lote, lotes, sucursal } = req.body;
    if (!nombre || !categoria || precio === undefined || (!vencimiento && (!Array.isArray(lotes) || lotes.length === 0))) {
      throw new ValidationError("Todos los campos son obligatorios");
    }
    const lotesProducto = prepararLotes({ lotes, lote, stock, vencimiento });
    const stockTotal = calcularStockTotal(lotesProducto);
    const vencimientoPrincipal = obtenerProximoVencimiento(lotesProducto, vencimiento);
    const lotePrincipal = obtenerLotePrincipal(lotesProducto, lote);
    if (stockTotal < 0 || !vencimientoPrincipal) throw new ValidationError("Los datos de lote, stock y vencimiento no son validos");
    let sucursalProducto = req.usuario.sucursal?._id || req.usuario.sucursal;
    if (req.usuario.rol === "admin") {
      if (!sucursal) throw new ValidationError("El administrador debe seleccionar una sucursal");
      sucursalProducto = sucursal;
    }
    const sucursalValida = await Sucursal.findOne({ _id: sucursalProducto, empresa: req.empresaId });
    if (!sucursalValida) throw new ForbiddenError("La sucursal no pertenece a tu empresa");
    const producto = await Producto.create({
      nombre, categoria, stock: stockTotal, precio, vencimiento: vencimientoPrincipal,
      codigoBarras: codigoBarras || "", lote: lotePrincipal, lotes: lotesProducto,
      usuario: req.usuario._id, sucursal: sucursalProducto, empresa: req.empresaId,
      creadoPor: req.usuario._id, actualizadoPor: req.usuario._id, fechaUltimaActualizacion: new Date()
    });
    await Movimiento.create({
      producto: producto._id, nombreProducto: producto.nombre, lote: producto.lote || "",
      accion: "CREAR", usuario: req.usuario._id, sucursal: sucursalProducto, empresa: req.empresaId,
      detalle: "Producto creado por " + req.usuario.nombre,
      cambios: { nombre: producto.nombre, categoria: producto.categoria, stock: producto.stock, precio: producto.precio, vencimiento: producto.vencimiento, codigoBarras: producto.codigoBarras || "", lote: producto.lote || "", lotes: producto.lotes || [] }
    });
    const productoCompleto = await Producto.findById(producto._id)
      .populate("sucursal", "zona numero direccion empresa")
      .populate("creadoPor", "nombre email rol")
      .populate("actualizadoPor", "nombre email rol");
    res.status(201).json(productoCompleto);
  } catch (error) {
    next(error);
  }
};

const actualizarProducto = async (req, res, next) => {
  try {
    const producto = await Producto.findOne({ _id: req.params.id, empresa: req.empresaId });
    if (!producto) throw new NotFoundError("Producto");
    const esAdmin = req.usuario.rol === "admin";
    const sucursalUsuario = req.usuario.sucursal?._id || req.usuario.sucursal;
    if (!esAdmin && producto.sucursal.toString() !== sucursalUsuario.toString()) throw new ForbiddenError("No autorizado para editar este producto");
    const datosAnteriores = { nombre: producto.nombre, categoria: producto.categoria, stock: producto.stock, precio: producto.precio, vencimiento: producto.vencimiento, codigoBarras: producto.codigoBarras || "", lote: producto.lote || "", lotes: producto.lotes || [], sucursal: producto.sucursal };
    const { nombre, categoria, stock, precio, vencimiento, codigoBarras, lote, lotes, sucursal } = req.body;
    const lotesProducto = prepararLotes({ lotes, lote, stock, vencimiento });
    const stockTotal = calcularStockTotal(lotesProducto);
    const vencimientoPrincipal = obtenerProximoVencimiento(lotesProducto, vencimiento);
    const lotePrincipal = obtenerLotePrincipal(lotesProducto, lote);
    const camposUpdate = { nombre, categoria, stock: stockTotal, precio, vencimiento: vencimientoPrincipal, codigoBarras: codigoBarras || "", lote: lotePrincipal, lotes: lotesProducto, actualizadoPor: req.usuario._id, fechaUltimaActualizacion: new Date() };
    if (sucursal && esAdmin) {
      const destinoValido = await Sucursal.findOne({ _id: sucursal, empresa: req.empresaId });
      if (!destinoValido) throw new ForbiddenError("La sucursal destino no pertenece a tu empresa");
      camposUpdate.sucursal = sucursal;
    }
    const productoActualizado = await Producto.findByIdAndUpdate(req.params.id, camposUpdate, { new: true, runValidators: true })
      .populate("sucursal", "zona numero direccion empresa")
      .populate("creadoPor", "nombre email rol")
      .populate("actualizadoPor", "nombre email rol");
    const fueTransferencia = sucursal && esAdmin && datosAnteriores.sucursal?.toString() !== sucursal?.toString();
    await Movimiento.create({
      producto: producto._id, nombreProducto: productoActualizado.nombre, lote: productoActualizado.lote || "",
      accion: "EDITAR", usuario: req.usuario._id, empresa: req.empresaId,
      sucursal: productoActualizado.sucursal?._id || productoActualizado.sucursal || producto.sucursal,
      detalle: fueTransferencia ? "Producto transferido a sucursal " + sucursal + " por " + req.usuario.nombre : "Producto editado por " + req.usuario.nombre,
      cambios: { antes: datosAnteriores, despues: { nombre: productoActualizado.nombre, categoria: productoActualizado.categoria, stock: productoActualizado.stock, precio: productoActualizado.precio, vencimiento: productoActualizado.vencimiento, codigoBarras: productoActualizado.codigoBarras || "", lote: productoActualizado.lote || "", lotes: productoActualizado.lotes || [], sucursal: productoActualizado.sucursal?._id } }
    });
    res.json(productoActualizado);
  } catch (error) {
    next(error);
  }
};

const eliminarProducto = async (req, res, next) => {
  try {
    const producto = await Producto.findOne({ _id: req.params.id, empresa: req.empresaId });
    if (!producto) throw new NotFoundError("Producto");
    const esAdmin = req.usuario.rol === "admin";
    const sucursalUsuario = req.usuario.sucursal?._id || req.usuario.sucursal;
    if (!esAdmin && producto.sucursal.toString() !== sucursalUsuario.toString()) throw new ForbiddenError("No autorizado para eliminar este producto");
    await Movimiento.create({
      producto: producto._id, nombreProducto: producto.nombre, lote: producto.lote || "",
      accion: "ELIMINAR", usuario: req.usuario._id, sucursal: producto.sucursal, empresa: req.empresaId,
      detalle: "Producto eliminado por " + req.usuario.nombre,
      cambios: { nombre: producto.nombre, categoria: producto.categoria, stock: producto.stock, precio: producto.precio, vencimiento: producto.vencimiento, codigoBarras: producto.codigoBarras || "", lote: producto.lote || "", lotes: producto.lotes || [] }
    });
    await Producto.findByIdAndDelete(req.params.id);
    res.json({ mensaje: "Producto eliminado correctamente", eliminadoPor: { _id: req.usuario._id, nombre: req.usuario.nombre, email: req.usuario.email } });
  } catch (error) {
    next(error);
  }
};

module.exports = { obtenerProductos, crearProducto, actualizarProducto, eliminarProducto };

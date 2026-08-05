const logger = require("../utils/logger");
const ProductoRepository = require("../repositories/producto.repository");
const SucursalRepository = require("../repositories/sucursal.repository");
const { NotFoundError, ValidationError, ForbiddenError } = require("../utils/errors/AppError");

function prepararLotes({ lotes, lote, stock, vencimiento }) {
  if (Array.isArray(lotes) && lotes.length > 0) {
    return lotes.map((item) => ({ numero: item.numero || item.lote || "", stock: Number(item.stock || 0), vencimiento: item.vencimiento }));
  }
  return [{ numero: lote || "", stock: Number(stock || 0), vencimiento }];
}
function calcularStockTotal(lotes) {
  return lotes.reduce((total, l) => total + Number(l.stock || 0), 0);
}
function obtenerProximoVencimiento(lotes, fallback) {
  const ordenados = [...lotes].filter((l) => l.vencimiento).sort((a, b) => new Date(a.vencimiento) - new Date(b.vencimiento));
  return ordenados[0]?.vencimiento || fallback;
}
function obtenerLotePrincipal(lotes, fallback) {
  return lotes[0]?.numero || fallback || "";
}

const obtenerProductos = async (req, res, next) => {
  try {
    const filtrosExtra = {};
    if (req.usuario.rol === "admin") {
      if (req.query.sucursal) filtrosExtra.sucursal = req.query.sucursal;
    } else {
      filtrosExtra.sucursal = req.usuario.sucursal?._id || req.usuario.sucursal;
    }
    const productos = await ProductoRepository.findByEmpresa(req.empresaId, filtrosExtra);
    res.json(productos);
  } catch (error) {
    next(error);
  }
};

const crearProducto = async (req, res, next) => {
  try {
    const { nombre, categoria, stock, precio, vencimiento, codigoBarras, lote, lotes, sucursal } = req.body;
    const lotesProducto = prepararLotes({ lotes, lote, stock, vencimiento });
    const stockTotal = calcularStockTotal(lotesProducto);
    const vencimientoPrincipal = obtenerProximoVencimiento(lotesProducto, vencimiento);
    const lotePrincipal = obtenerLotePrincipal(lotesProducto, lote);
    if (!vencimientoPrincipal) throw new ValidationError("Vencimiento invalido");
    let sucursalId = req.usuario.sucursal?._id || req.usuario.sucursal;
    if (req.usuario.rol === "admin") {
      if (!sucursal) throw new ValidationError("El administrador debe seleccionar una sucursal");
      sucursalId = sucursal;
    }
    const sucursalValida = await SucursalRepository.findById(sucursalId, req.empresaId);
    if (!sucursalValida) throw new ForbiddenError("La sucursal no pertenece a tu empresa");
    const producto = await ProductoRepository.create({
      nombre, categoria, stock: stockTotal, precio, vencimiento: vencimientoPrincipal,
      codigoBarras: codigoBarras || "", lote: lotePrincipal, lotes: lotesProducto,
      usuario: req.usuario._id, sucursal: sucursalId, empresa: req.empresaId,
      creadoPor: req.usuario._id, actualizadoPor: req.usuario._id, fechaUltimaActualizacion: new Date()
    });
    await ProductoRepository.registrarMovimiento({
      producto: producto._id, nombreProducto: producto.nombre, lote: producto.lote || "",
      accion: "CREAR", usuario: req.usuario._id, sucursal: sucursalId, empresa: req.empresaId,
      detalle: "Producto creado por " + req.usuario.nombre,
      cambios: { nombre: producto.nombre, categoria: producto.categoria, stock: producto.stock, precio: producto.precio, vencimiento: producto.vencimiento, codigoBarras: producto.codigoBarras || "", lote: producto.lote || "", lotes: producto.lotes || [] }
    });
    const productoCompleto = await ProductoRepository.findById(producto._id, req.empresaId);
    res.status(201).json(productoCompleto);
  } catch (error) {
    next(error);
  }
};

const actualizarProducto = async (req, res, next) => {
  try {
    const producto = await ProductoRepository.findById(req.params.id, req.empresaId);
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
      const destinoValido = await SucursalRepository.findById(sucursal, req.empresaId);
      if (!destinoValido) throw new ForbiddenError("La sucursal destino no pertenece a tu empresa");
      camposUpdate.sucursal = sucursal;
    }
    const productoActualizado = await ProductoRepository.update(req.params.id, camposUpdate);
    const fueTransferencia = sucursal && esAdmin && datosAnteriores.sucursal?.toString() !== sucursal?.toString();
    await ProductoRepository.registrarMovimiento({
      producto: producto._id, nombreProducto: productoActualizado.nombre, lote: productoActualizado.lote || "",
      accion: "EDITAR", usuario: req.usuario._id, empresa: req.empresaId,
      sucursal: productoActualizado.sucursal?._id || productoActualizado.sucursal || producto.sucursal,
      detalle: fueTransferencia ? "Producto transferido por " + req.usuario.nombre : "Producto editado por " + req.usuario.nombre,
      cambios: { antes: datosAnteriores, despues: { nombre: productoActualizado.nombre, categoria: productoActualizado.categoria, stock: productoActualizado.stock, precio: productoActualizado.precio, vencimiento: productoActualizado.vencimiento, codigoBarras: productoActualizado.codigoBarras || "", lote: productoActualizado.lote || "", lotes: productoActualizado.lotes || [], sucursal: productoActualizado.sucursal?._id } }
    });
    res.json(productoActualizado);
  } catch (error) {
    next(error);
  }
};

const eliminarProducto = async (req, res, next) => {
  try {
    const producto = await ProductoRepository.findById(req.params.id, req.empresaId);
    if (!producto) throw new NotFoundError("Producto");
    const esAdmin = req.usuario.rol === "admin";
    const sucursalUsuario = req.usuario.sucursal?._id || req.usuario.sucursal;
    if (!esAdmin && producto.sucursal.toString() !== sucursalUsuario.toString()) throw new ForbiddenError("No autorizado para eliminar este producto");
    await ProductoRepository.registrarMovimiento({
      producto: producto._id, nombreProducto: producto.nombre, lote: producto.lote || "",
      accion: "ELIMINAR", usuario: req.usuario._id, sucursal: producto.sucursal, empresa: req.empresaId,
      detalle: "Producto eliminado por " + req.usuario.nombre,
      cambios: { nombre: producto.nombre, categoria: producto.categoria, stock: producto.stock, precio: producto.precio, vencimiento: producto.vencimiento, codigoBarras: producto.codigoBarras || "", lote: producto.lote || "", lotes: producto.lotes || [] }
    });
    await ProductoRepository.delete(req.params.id);
    res.json({ mensaje: "Producto eliminado correctamente", eliminadoPor: { _id: req.usuario._id, nombre: req.usuario.nombre, email: req.usuario.email } });
  } catch (error) {
    next(error);
  }
};

module.exports = { obtenerProductos, crearProducto, actualizarProducto, eliminarProducto };

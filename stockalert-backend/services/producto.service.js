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

const ProductoService = {
  listar: (empresaId, filtrosExtra = {}) =>
    ProductoRepository.findByEmpresa(empresaId, filtrosExtra),

  crear: async (empresaId, usuario, datos) => {
    const { nombre, categoria, stock, precio, vencimiento, codigoBarras, lote, lotes, sucursal } = datos;
    const lotesProducto = prepararLotes({ lotes, lote, stock, vencimiento });
    const stockTotal = calcularStockTotal(lotesProducto);
    const vencimientoPrincipal = obtenerProximoVencimiento(lotesProducto, vencimiento);
    const lotePrincipal = obtenerLotePrincipal(lotesProducto, lote);
    if (!vencimientoPrincipal) throw new ValidationError("Vencimiento invalido");
    let sucursalId = usuario.sucursal?._id || usuario.sucursal;
    if (usuario.rol === "admin") {
      if (!sucursal) throw new ValidationError("El administrador debe seleccionar una sucursal");
      sucursalId = sucursal;
    }
    const sucursalValida = await SucursalRepository.findById(sucursalId, empresaId);
    if (!sucursalValida) throw new ForbiddenError("La sucursal no pertenece a tu empresa");
    const producto = await ProductoRepository.create({
      nombre, categoria, stock: stockTotal, precio, vencimiento: vencimientoPrincipal,
      codigoBarras: codigoBarras || "", lote: lotePrincipal, lotes: lotesProducto,
      usuario: usuario._id, sucursal: sucursalId, empresa: empresaId,
      creadoPor: usuario._id, actualizadoPor: usuario._id, fechaUltimaActualizacion: new Date()
    });
    await ProductoRepository.registrarMovimiento({
      producto: producto._id, nombreProducto: producto.nombre, lote: producto.lote || "",
      accion: "CREAR", usuario: usuario._id, sucursal: sucursalId, empresa: empresaId,
      detalle: "Producto creado por " + usuario.nombre,
      cambios: { nombre: producto.nombre, categoria: producto.categoria, stock: producto.stock, precio: producto.precio, vencimiento: producto.vencimiento, codigoBarras: producto.codigoBarras || "", lote: producto.lote || "", lotes: producto.lotes || [] }
    });
    return ProductoRepository.findById(producto._id, empresaId);
  },

  actualizar: async (id, empresaId, usuario, datos) => {
    const producto = await ProductoRepository.findById(id, empresaId);
    if (!producto) throw new NotFoundError("Producto");
    const esAdmin = usuario.rol === "admin";
    const sucursalUsuario = usuario.sucursal?._id || usuario.sucursal;
    if (!esAdmin && producto.sucursal.toString() !== sucursalUsuario.toString()) throw new ForbiddenError("No autorizado para editar este producto");
    const datosAnteriores = { nombre: producto.nombre, categoria: producto.categoria, stock: producto.stock, precio: producto.precio, vencimiento: producto.vencimiento, codigoBarras: producto.codigoBarras || "", lote: producto.lote || "", lotes: producto.lotes || [], sucursal: producto.sucursal };
    const { nombre, categoria, stock, precio, vencimiento, codigoBarras, lote, lotes, sucursal } = datos;
    const lotesProducto = prepararLotes({ lotes, lote, stock, vencimiento });
    const stockTotal = calcularStockTotal(lotesProducto);
    const vencimientoPrincipal = obtenerProximoVencimiento(lotesProducto, vencimiento);
    const lotePrincipal = obtenerLotePrincipal(lotesProducto, lote);
    const camposUpdate = { nombre, categoria, stock: stockTotal, precio, vencimiento: vencimientoPrincipal, codigoBarras: codigoBarras || "", lote: lotePrincipal, lotes: lotesProducto, actualizadoPor: usuario._id, fechaUltimaActualizacion: new Date() };
    if (sucursal && esAdmin) {
      const destinoValido = await SucursalRepository.findById(sucursal, empresaId);
      if (!destinoValido) throw new ForbiddenError("La sucursal destino no pertenece a tu empresa");
      camposUpdate.sucursal = sucursal;
    }
    const productoActualizado = await ProductoRepository.update(id, camposUpdate);
    const fueTransferencia = sucursal && esAdmin && datosAnteriores.sucursal?.toString() !== sucursal?.toString();
    await ProductoRepository.registrarMovimiento({
      producto: producto._id, nombreProducto: productoActualizado.nombre, lote: productoActualizado.lote || "",
      accion: "EDITAR", usuario: usuario._id, empresa: empresaId,
      sucursal: productoActualizado.sucursal?._id || productoActualizado.sucursal || producto.sucursal,
      detalle: fueTransferencia ? "Producto transferido por " + usuario.nombre : "Producto editado por " + usuario.nombre,
      cambios: { antes: datosAnteriores, despues: { nombre: productoActualizado.nombre, categoria: productoActualizado.categoria, stock: productoActualizado.stock, precio: productoActualizado.precio, vencimiento: productoActualizado.vencimiento, codigoBarras: productoActualizado.codigoBarras || "", lote: productoActualizado.lote || "", lotes: productoActualizado.lotes || [], sucursal: productoActualizado.sucursal?._id } }
    });
    return productoActualizado;
  },

  eliminar: async (id, empresaId, usuario) => {
    const producto = await ProductoRepository.findById(id, empresaId);
    if (!producto) throw new NotFoundError("Producto");
    const esAdmin = usuario.rol === "admin";
    const sucursalUsuario = usuario.sucursal?._id || usuario.sucursal;
    if (!esAdmin && producto.sucursal.toString() !== sucursalUsuario.toString()) throw new ForbiddenError("No autorizado para eliminar este producto");
    await ProductoRepository.registrarMovimiento({
      producto: producto._id, nombreProducto: producto.nombre, lote: producto.lote || "",
      accion: "ELIMINAR", usuario: usuario._id, sucursal: producto.sucursal, empresa: empresaId,
      detalle: "Producto eliminado por " + usuario.nombre,
      cambios: { nombre: producto.nombre, categoria: producto.categoria, stock: producto.stock, precio: producto.precio, vencimiento: producto.vencimiento, codigoBarras: producto.codigoBarras || "", lote: producto.lote || "", lotes: producto.lotes || [] }
    });
    await ProductoRepository.delete(id);
    return { mensaje: "Producto eliminado correctamente", eliminadoPor: { _id: usuario._id, nombre: usuario.nombre, email: usuario.email } };
  }
};

module.exports = ProductoService;

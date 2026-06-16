const Producto = require("../models/Producto");
const Movimiento = require("../models/Movimiento");

function prepararLotes({ lotes, lote, stock, vencimiento }) {
  if (Array.isArray(lotes) && lotes.length > 0) {
    return lotes.map((item) => ({
      numero: item.numero || item.lote || "",
      stock: Number(item.stock || 0),
      vencimiento: item.vencimiento
    }));
  }
  return [{ numero: lote || "", stock: Number(stock || 0), vencimiento }];
}

function calcularStockTotal(lotes) {
  if (!Array.isArray(lotes) || lotes.length === 0) return 0;
  return lotes.reduce((total, lote) => total + Number(lote.stock || 0), 0);
}

function obtenerProximoVencimiento(lotes, vencimientoFallback) {
  if (!Array.isArray(lotes) || lotes.length === 0) return vencimientoFallback;
  const ordenados = [...lotes]
    .filter((l) => l.vencimiento)
    .sort((a, b) => new Date(a.vencimiento) - new Date(b.vencimiento));
  return ordenados[0]?.vencimiento || vencimientoFallback;
}

function obtenerLotePrincipal(lotes, loteFallback) {
  if (!Array.isArray(lotes) || lotes.length === 0) return loteFallback || "";
  return lotes[0].numero || "";
}

// ========================= //
// OBTENER PRODUCTOS         //
// ========================= //
const obtenerProductos = async (req, res) => {
  try {
    let filtro = {};
    if (req.usuario.rol === "admin") {
      if (req.query.sucursal) filtro.sucursal = req.query.sucursal;
    } else {
      filtro.sucursal = req.usuario.sucursal?._id || req.usuario.sucursal;
    }

    const productos = await Producto.find(filtro)
      .populate("sucursal", "nombre direccion empresa")
      .populate("creadoPor", "nombre email rol")
      .populate("actualizadoPor", "nombre email rol")
      .sort({ createdAt: -1 });

    res.json(productos);
  } catch (error) {
    console.error("ERROR OBTENER PRODUCTOS:", error);
    res.status(500).json({ mensaje: "Error al obtener productos" });
  }
};

// ========================= //
// CREAR PRODUCTO            //
// ========================= //
const crearProducto = async (req, res) => {
  try {
    const { nombre, categoria, stock, precio, vencimiento, codigoBarras, lote, lotes, sucursal } = req.body;

    if (!nombre || !categoria || precio === undefined ||
        (!vencimiento && (!Array.isArray(lotes) || lotes.length === 0))) {
      return res.status(400).json({ mensaje: "Todos los campos son obligatorios" });
    }

    const lotesProducto = prepararLotes({ lotes, lote, stock, vencimiento });
    const stockTotal = calcularStockTotal(lotesProducto);
    const vencimientoPrincipal = obtenerProximoVencimiento(lotesProducto, vencimiento);
    const lotePrincipal = obtenerLotePrincipal(lotesProducto, lote);

    if (stockTotal < 0 || !vencimientoPrincipal) {
      return res.status(400).json({ mensaje: "Los datos de lote, stock y vencimiento no son válidos" });
    }

    let sucursalProducto = req.usuario.sucursal?._id || req.usuario.sucursal;
    if (req.usuario.rol === "admin") {
      if (!sucursal) return res.status(400).json({ mensaje: "El administrador debe seleccionar una sucursal" });
      sucursalProducto = sucursal;
    }

    const producto = await Producto.create({
      nombre, categoria,
      stock: stockTotal, precio,
      vencimiento: vencimientoPrincipal,
      codigoBarras: codigoBarras || "",
      lote: lotePrincipal,
      lotes: lotesProducto,
      usuario: req.usuario._id,
      sucursal: sucursalProducto,
      creadoPor: req.usuario._id,
      actualizadoPor: req.usuario._id,
      fechaUltimaActualizacion: new Date()
    });

    await Movimiento.create({
      producto: producto._id,
      nombreProducto: producto.nombre,
      lote: producto.lote || "",
      accion: "CREAR",
      usuario: req.usuario._id,
      sucursal: sucursalProducto,
      detalle: `Producto creado por ${req.usuario.nombre}`,
      cambios: { nombre: producto.nombre, categoria: producto.categoria, stock: producto.stock, precio: producto.precio, vencimiento: producto.vencimiento, codigoBarras: producto.codigoBarras || "", lote: producto.lote || "", lotes: producto.lotes || [] }
    });

    const productoCompleto = await Producto.findById(producto._id)
      .populate("sucursal", "nombre direccion empresa")
      .populate("creadoPor", "nombre email rol")
      .populate("actualizadoPor", "nombre email rol");

    res.status(201).json(productoCompleto);
  } catch (error) {
    console.error("ERROR CREAR PRODUCTO:", error);
    res.status(500).json({ mensaje: error.message || "Error al crear producto" });
  }
};

// ========================= //
// ACTUALIZAR PRODUCTO       //
// ========================= //
const actualizarProducto = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) return res.status(404).json({ mensaje: "Producto no encontrado" });

    const esAdmin = req.usuario.rol === "admin";
    const sucursalUsuario = req.usuario.sucursal?._id || req.usuario.sucursal;

    if (!esAdmin && producto.sucursal.toString() !== sucursalUsuario.toString()) {
      return res.status(403).json({ mensaje: "No autorizado para editar este producto" });
    }

    const datosAnteriores = {
      nombre: producto.nombre, categoria: producto.categoria,
      stock: producto.stock, precio: producto.precio,
      vencimiento: producto.vencimiento,
      codigoBarras: producto.codigoBarras || "",
      lote: producto.lote || "", lotes: producto.lotes || [],
      sucursal: producto.sucursal
    };

    const { nombre, categoria, stock, precio, vencimiento, codigoBarras, lote, lotes, sucursal } = req.body;

    const lotesProducto = prepararLotes({ lotes, lote, stock, vencimiento });
    const stockTotal = calcularStockTotal(lotesProducto);
    const vencimientoPrincipal = obtenerProximoVencimiento(lotesProducto, vencimiento);
    const lotePrincipal = obtenerLotePrincipal(lotesProducto, lote);

    // Campos a actualizar
    const camposUpdate = {
      nombre, categoria,
      stock: stockTotal, precio,
      vencimiento: vencimientoPrincipal,
      codigoBarras: codigoBarras || "",
      lote: lotePrincipal,
      lotes: lotesProducto,
      actualizadoPor: req.usuario._id,
      fechaUltimaActualizacion: new Date()
    };

    // ✅ INCLUIR SUCURSAL si se manda (para transferencias)
    if (sucursal && esAdmin) {
      camposUpdate.sucursal = sucursal;
    }

    const productoActualizado = await Producto.findByIdAndUpdate(
      req.params.id,
      camposUpdate,
      { new: true, runValidators: true }
    )
      .populate("sucursal", "nombre direccion empresa")
      .populate("creadoPor", "nombre email rol")
      .populate("actualizadoPor", "nombre email rol");

    // Detectar si fue una transferencia
    const fueTransferencia = sucursal && esAdmin &&
      datosAnteriores.sucursal?.toString() !== sucursal?.toString();

    const accionMovimiento = fueTransferencia ? "EDITAR" : "EDITAR";
    const detalleMovimiento = fueTransferencia
      ? `Producto transferido a sucursal ${sucursal} por ${req.usuario.nombre}`
      : `Producto editado por ${req.usuario.nombre}`;

    await Movimiento.create({
      producto: producto._id,
      nombreProducto: productoActualizado.nombre,
      lote: productoActualizado.lote || "",
      accion: accionMovimiento,
      usuario: req.usuario._id,
      sucursal: productoActualizado.sucursal?._id || productoActualizado.sucursal || producto.sucursal,
      detalle: detalleMovimiento,
      cambios: {
        antes: datosAnteriores,
        despues: {
          nombre: productoActualizado.nombre, categoria: productoActualizado.categoria,
          stock: productoActualizado.stock, precio: productoActualizado.precio,
          vencimiento: productoActualizado.vencimiento,
          codigoBarras: productoActualizado.codigoBarras || "",
          lote: productoActualizado.lote || "", lotes: productoActualizado.lotes || [],
          sucursal: productoActualizado.sucursal?._id
        }
      }
    });

    res.json(productoActualizado);
  } catch (error) {
    console.error("ERROR ACTUALIZAR PRODUCTO:", error);
    res.status(500).json({ mensaje: error.message || "Error al actualizar producto" });
  }
};

// ========================= //
// ELIMINAR PRODUCTO         //
// ========================= //
const eliminarProducto = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) return res.status(404).json({ mensaje: "Producto no encontrado" });

    const esAdmin = req.usuario.rol === "admin";
    const sucursalUsuario = req.usuario.sucursal?._id || req.usuario.sucursal;

    if (!esAdmin && producto.sucursal.toString() !== sucursalUsuario.toString()) {
      return res.status(403).json({ mensaje: "No autorizado para eliminar este producto" });
    }

    await Movimiento.create({
      producto: producto._id,
      nombreProducto: producto.nombre,
      lote: producto.lote || "",
      accion: "ELIMINAR",
      usuario: req.usuario._id,
      sucursal: producto.sucursal,
      detalle: `Producto eliminado por ${req.usuario.nombre}`,
      cambios: { nombre: producto.nombre, categoria: producto.categoria, stock: producto.stock, precio: producto.precio, vencimiento: producto.vencimiento, codigoBarras: producto.codigoBarras || "", lote: producto.lote || "", lotes: producto.lotes || [] }
    });

    await Producto.findByIdAndDelete(req.params.id);

    res.json({ mensaje: "Producto eliminado correctamente", eliminadoPor: { _id: req.usuario._id, nombre: req.usuario.nombre, email: req.usuario.email } });
  } catch (error) {
    console.error("ERROR ELIMINAR PRODUCTO:", error);
    res.status(500).json({ mensaje: error.message || "Error al eliminar producto" });
  }
};

module.exports = { obtenerProductos, crearProducto, actualizarProducto, eliminarProducto };
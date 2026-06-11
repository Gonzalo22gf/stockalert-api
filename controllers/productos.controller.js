const Producto = require("../models/Producto");

const obtenerProductos = async (req, res) => {
  try {
    let filtro = {};

    if (req.usuario.rol === "admin") {
      if (req.query.sucursal) {
        filtro.sucursal = req.query.sucursal;
      }
    } else {
      filtro.sucursal = req.usuario.sucursal._id;
    }

    const productos = await Producto.find(filtro)
      .populate("sucursal", "nombre direccion empresa")
      .populate("creadoPor", "nombre email rol")
      .populate("actualizadoPor", "nombre email rol")
      .sort({ createdAt: -1 });

    res.json(productos);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener productos"
    });
  }
};

const crearProducto = async (req, res) => {
  try {
    const {
      nombre,
      categoria,
      stock,
      precio,
      vencimiento,
      codigoBarras,
      lote,
      sucursal
    } = req.body;

    if (
      !nombre ||
      !categoria ||
      stock === undefined ||
      precio === undefined ||
      !vencimiento
    ) {
      return res.status(400).json({
        mensaje: "Todos los campos son obligatorios"
      });
    }

    let sucursalProducto = req.usuario.sucursal._id;

    if (req.usuario.rol === "admin" && sucursal) {
      sucursalProducto = sucursal;
    }

    const producto = await Producto.create({
      nombre,
      categoria,
      stock,
      precio,
      vencimiento,
      codigoBarras: codigoBarras || "",
      lote: lote || "",
      usuario: req.usuario._id,
      sucursal: sucursalProducto,
      creadoPor: req.usuario._id,
      actualizadoPor: req.usuario._id,
      fechaUltimaActualizacion: new Date()
    });

    const productoCompleto = await Producto.findById(producto._id)
      .populate("sucursal", "nombre direccion empresa")
      .populate("creadoPor", "nombre email rol")
      .populate("actualizadoPor", "nombre email rol");

    res.status(201).json(productoCompleto);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al crear producto"
    });
  }
};

const actualizarProducto = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);

    if (!producto) {
      return res.status(404).json({
        mensaje: "Producto no encontrado"
      });
    }

    const esAdmin = req.usuario.rol === "admin";

    if (
      !esAdmin &&
      producto.sucursal.toString() !== req.usuario.sucursal._id.toString()
    ) {
      return res.status(403).json({
        mensaje: "No autorizado para editar este producto"
      });
    }

    const {
      nombre,
      categoria,
      stock,
      precio,
      vencimiento,
      codigoBarras,
      lote
    } = req.body;

    const productoActualizado = await Producto.findByIdAndUpdate(
      req.params.id,
      {
        nombre,
        categoria,
        stock,
        precio,
        vencimiento,
        codigoBarras,
        lote: lote || "",
        actualizadoPor: req.usuario._id,
        fechaUltimaActualizacion: new Date()
      },
      {
        new: true,
        runValidators: true
      }
    )
      .populate("sucursal", "nombre direccion empresa")
      .populate("creadoPor", "nombre email rol")
      .populate("actualizadoPor", "nombre email rol");

    res.json(productoActualizado);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al actualizar producto"
    });
  }
};

const eliminarProducto = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);

    if (!producto) {
      return res.status(404).json({
        mensaje: "Producto no encontrado"
      });
    }

    const esAdmin = req.usuario.rol === "admin";

    if (
      !esAdmin &&
      producto.sucursal.toString() !== req.usuario.sucursal._id.toString()
    ) {
      return res.status(403).json({
        mensaje: "No autorizado para eliminar este producto"
      });
    }

    await Producto.findByIdAndDelete(req.params.id);

    res.json({
      mensaje: "Producto eliminado correctamente",
      eliminadoPor: {
        _id: req.usuario._id,
        nombre: req.usuario.nombre,
        email: req.usuario.email
      }
    });
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al eliminar producto"
    });
  }
};

module.exports = {
  obtenerProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto
};
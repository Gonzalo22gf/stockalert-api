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
      usuario: req.usuario._id,
      sucursal: sucursalProducto
    });

    res.status(201).json(producto);
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
      codigoBarras
    } = req.body;

    const productoActualizado = await Producto.findByIdAndUpdate(
      req.params.id,
      {
        nombre,
        categoria,
        stock,
        precio,
        vencimiento,
        codigoBarras
      },
      {
        new: true,
        runValidators: true
      }
    );

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
      mensaje: "Producto eliminado correctamente"
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
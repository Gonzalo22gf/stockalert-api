const Producto = require("../models/Producto");

const obtenerProductos = async (req, res) => {
  try {
    const productos = await Producto.find({
      usuario: req.usuario._id
    }).sort({ createdAt: -1 });

    res.json(productos);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener productos"
    });
  }
};

const crearProducto = async (req, res) => {
  try {
    const { nombre, categoria, stock, precio, vencimiento } = req.body;

    if (!nombre || !categoria || stock === undefined || precio === undefined || !vencimiento) {
      return res.status(400).json({
        mensaje: "Todos los campos son obligatorios"
      });
    }

    const producto = await Producto.create({
      nombre,
      categoria,
      stock,
      precio,
      vencimiento,
      usuario: req.usuario._id
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

    if (producto.usuario.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({
        mensaje: "No autorizado"
      });
    }

    const productoActualizado = await Producto.findByIdAndUpdate(
      req.params.id,
      req.body,
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

    if (producto.usuario.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({
        mensaje: "No autorizado"
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
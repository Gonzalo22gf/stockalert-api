const Sucursal = require("../models/Sucursal");
const Producto = require("../models/Producto");

// LISTAR TODAS
const obtenerSucursales = async (req, res) => {
  try {
    const sucursales = await Sucursal.find().sort({ nombre: 1 });
    res.json(sucursales);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener sucursales" });
  }
};

// RESUMEN (solo admin)
const obtenerResumenSucursales = async (req, res) => {
  try {
    if (req.usuario.rol !== "admin") {
      return res.status(403).json({ mensaje: "No autorizado" });
    }

    const sucursales = await Sucursal.find().sort({ nombre: 1 });
    const hoy = new Date();

    const resumen = await Promise.all(
      sucursales.map(async (sucursal) => {
        const productos = await Producto.find({ sucursal: sucursal._id });

        const totalProductos = productos.length;

        const vencidos = productos.filter((p) => new Date(p.vencimiento) < hoy).length;

        const porVencer = productos.filter((p) => {
          const diff = Math.ceil((new Date(p.vencimiento) - hoy) / (1000 * 60 * 60 * 24));
          return diff >= 0 && diff <= 7;
        }).length;

        const stockCritico = productos.filter((p) => p.stock > 0 && p.stock <= 5).length;
        const agotados     = productos.filter((p) => p.stock === 0).length;
        const valorInventario = productos.reduce((t, p) => t + p.stock * p.precio, 0);

        return {
          sucursal: {
            _id:      sucursal._id,
            nombre:   sucursal.nombre,
            direccion:sucursal.direccion,
            numero:   sucursal.numero,
            empresa:  sucursal.empresa
          },
          totalProductos,
          vencidos,
          porVencer,
          stockCritico,
          agotados,
          valorInventario
        };
      })
    );

    res.json(resumen);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener resumen de sucursales" });
  }
};

// EDITAR SUCURSAL (solo admin)
const editarSucursal = async (req, res) => {
  try {
    const { nombre, direccion, numero } = req.body;

    if (!nombre || nombre.trim() === "") {
      return res.status(400).json({ mensaje: "El nombre es obligatorio" });
    }

    const sucursal = await Sucursal.findByIdAndUpdate(
      req.params.id,
      {
        nombre:    nombre.trim(),
        direccion: direccion?.trim() || "",
        ...(numero !== undefined && { numero: Number(numero) })
      },
      { new: true, runValidators: true }
    );

    if (!sucursal) {
      return res.status(404).json({ mensaje: "Sucursal no encontrada" });
    }

    res.json({ mensaje: "Sucursal actualizada", sucursal });
  } catch (error) {
    console.error("ERROR EDITAR SUCURSAL:", error);
    res.status(500).json({ mensaje: "Error al editar sucursal" });
  }
};

module.exports = {
  obtenerSucursales,
  obtenerResumenSucursales,
  editarSucursal
};
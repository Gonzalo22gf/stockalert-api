const Sucursal = require("../models/Sucursal");
const Producto = require("../models/Producto");

const obtenerSucursales = async (req, res) => {
  try {
    const sucursales = await Sucursal.find().sort({ nombre: 1 });

    res.json(sucursales);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener sucursales"
    });
  }
};

const obtenerResumenSucursales = async (req, res) => {
  try {
    if (req.usuario.rol !== "admin") {
      return res.status(403).json({
        mensaje: "No autorizado"
      });
    }

    const sucursales = await Sucursal.find().sort({ nombre: 1 });
    const hoy = new Date();

    const resumen = await Promise.all(
      sucursales.map(async (sucursal) => {
        const productos = await Producto.find({
          sucursal: sucursal._id
        });

        const totalProductos = productos.length;

        const vencidos = productos.filter((producto) => {
          return new Date(producto.vencimiento) < hoy;
        }).length;

        const porVencer = productos.filter((producto) => {
          const vencimiento = new Date(producto.vencimiento);
          const diferenciaTiempo = vencimiento - hoy;
          const diferenciaDias = Math.ceil(
            diferenciaTiempo / (1000 * 60 * 60 * 24)
          );

          return diferenciaDias >= 0 && diferenciaDias <= 7;
        }).length;

        const stockCritico = productos.filter((producto) => {
          return producto.stock > 0 && producto.stock <= 5;
        }).length;

        const agotados = productos.filter((producto) => {
          return producto.stock === 0;
        }).length;

        const valorInventario = productos.reduce((total, producto) => {
          return total + producto.stock * producto.precio;
        }, 0);

        return {
          sucursal: {
            _id: sucursal._id,
            nombre: sucursal.nombre,
            direccion: sucursal.direccion,
            empresa: sucursal.empresa
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
    res.status(500).json({
      mensaje: "Error al obtener resumen de sucursales"
    });
  }
};

module.exports = {
  obtenerSucursales,
  obtenerResumenSucursales
};
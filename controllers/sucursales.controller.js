const Sucursal = require("../models/Sucursal");

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

module.exports = {
  obtenerSucursales
};
const Movimiento = require("../models/Movimiento");

const obtenerMovimientos = async (req, res) => {
  try {
    let filtro = {};

    if (req.usuario.rol !== "admin") {
      filtro.sucursal = req.usuario.sucursal?._id || req.usuario.sucursal;
    }

    if (req.usuario.rol === "admin" && req.query.sucursal) {
      filtro.sucursal = req.query.sucursal;
    }

    const movimientos = await Movimiento.find(filtro)
      .populate("usuario", "nombre email rol")
      .populate("sucursal", "nombre direccion empresa")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(movimientos);
  } catch (error) {
    console.error("ERROR OBTENER MOVIMIENTOS:", error);

    res.status(500).json({
      mensaje: "Error al obtener movimientos"
    });
  }
};

module.exports = {
  obtenerMovimientos
};
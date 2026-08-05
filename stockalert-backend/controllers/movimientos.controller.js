const logger = require("../utils/logger");
const Movimiento = require("../models/Movimiento");

const obtenerMovimientos = async (req, res, next) => {
  try {
    let filtro = { empresa: req.empresaId };
    if (req.usuario.rol !== "admin") {
      filtro.sucursal = req.usuario.sucursal?._id || req.usuario.sucursal;
    }
    if (req.usuario.rol === "admin" && req.query.sucursal) {
      filtro.sucursal = req.query.sucursal;
    }
    const movimientos = await Movimiento.find(filtro)
      .populate("usuario", "nombre email rol")
      .populate("sucursal", "zona numero direccion empresa")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(movimientos);
  } catch (error) {
    next(error);
  }
};

module.exports = { obtenerMovimientos };

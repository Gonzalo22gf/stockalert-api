const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuario");

const protegerRuta = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.usuario = await Usuario.findById(decoded.id)
        .select("-password")
        .populate("sucursal");

      if (!req.usuario) {
        return res.status(401).json({ mensaje: "Usuario no encontrado" });
      }

      // Verificar que la cuenta esté activa
      if (req.usuario.activo === false) {
        return res.status(403).json({ mensaje: "Cuenta desactivada" });
      }

      next();
    } catch (error) {
      return res.status(401).json({ mensaje: "Token inválido o expirado" });
    }
  }

  if (!token) {
    return res.status(401).json({ mensaje: "No autorizado, falta token" });
  }
};

// Middleware solo para administradores
const soloAdmin = (req, res, next) => {
  if (req.usuario && req.usuario.rol === "admin") {
    next();
  } else {
    res.status(403).json({ mensaje: "Acceso restringido a administradores" });
  }
};

module.exports = { protegerRuta, soloAdmin };
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

      req.usuario = await Usuario.findById(decoded.id).select("-password");

      next();
    } catch (error) {
      return res.status(401).json({
        mensaje: "Token inválido o expirado"
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      mensaje: "No autorizado, falta token"
    });
  }
};

module.exports = protegerRuta;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuario");
const Sucursal = require("../models/Sucursal");

const generarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d"
  });
};

const registrarUsuario = async (req, res) => {
  try {
    const {
      nombre,
      email,
      password,
      rol = "admin",
      nombreSucursal,
      direccionSucursal
    } = req.body;

    if (!nombre || !email || !password || !nombreSucursal) {
      return res.status(400).json({
        mensaje: "Nombre, email, contraseña y sucursal son obligatorios"
      });
    }

    const usuarioExiste = await Usuario.findOne({ email });

    if (usuarioExiste) {
      return res.status(400).json({
        mensaje: "El usuario ya existe"
      });
    }

    let sucursal = await Sucursal.findOne({
  nombre: nombreSucursal.trim()
});

if (!sucursal) {
  sucursal = await Sucursal.create({
    nombre: nombreSucursal.trim(),
    direccion: direccionSucursal || "",
    empresa: "Carrefour"
  });
}

    const salt = await bcrypt.genSalt(10);
    const passwordHasheado = await bcrypt.hash(password, salt);

    const usuario = await Usuario.create({
      nombre,
      email,
      password: passwordHasheado,
      rol,
      sucursal: sucursal._id
    });

    res.status(201).json({
      _id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      sucursal: {
        _id: sucursal._id,
        nombre: sucursal.nombre,
        direccion: sucursal.direccion
      },
      token: generarToken(usuario._id)
    });
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al registrar usuario"
    });
  }
};

const loginUsuario = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        mensaje: "Email y contraseña son obligatorios"
      });
    }

    const usuario = await Usuario.findOne({ email }).populate("sucursal");

    if (!usuario) {
      return res.status(401).json({
        mensaje: "Credenciales incorrectas"
      });
    }

    const passwordCorrecto = await bcrypt.compare(password, usuario.password);

    if (!passwordCorrecto) {
      return res.status(401).json({
        mensaje: "Credenciales incorrectas"
      });
    }

    res.json({
      _id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      sucursal: usuario.sucursal,
      token: generarToken(usuario._id)
    });
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al iniciar sesión"
    });
  }
};

const obtenerPerfil = async (req, res) => {
  const usuario = await Usuario.findById(req.usuario._id)
    .select("-password")
    .populate("sucursal");

  res.json(usuario);
};

module.exports = {
  registrarUsuario,
  loginUsuario,
  obtenerPerfil
};
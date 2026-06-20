const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuario");
const Sucursal = require("../models/Sucursal");

const generarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// REGISTRO
const registrarUsuario = async (req, res) => {
  try {
    const { nombre, email, password, numeroSucursal } = req.body;

    if (!nombre || !email || !password || numeroSucursal === undefined || numeroSucursal === null) {
      return res.status(400).json({ mensaje: "Nombre, email, contraseña y número de sucursal son obligatorios" });
    }

    const emailNormalizado = email.toLowerCase().trim();
    const usuarioExiste = await Usuario.findOne({ email: emailNormalizado });

    if (usuarioExiste) {
      return res.status(400).json({ mensaje: "El usuario ya existe" });
    }

    const sucursal = await Sucursal.findOne({ numero: Number(numeroSucursal) });

    if (!sucursal) {
      return res.status(400).json({ mensaje: "La sucursal indicada no existe. Contactá al administrador." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHasheado = await bcrypt.hash(password, salt);
    const rolAsignado = "jefe";

    const usuario = await Usuario.create({
      nombre,
      email: emailNormalizado,
      password: passwordHasheado,
      rol: rolAsignado,
      sucursal: sucursal._id,
      activo: true
    });

    res.status(201).json({
      _id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      sucursal: { _id: sucursal._id, zona: sucursal.zona, numero: sucursal.numero, direccion: sucursal.direccion },
      token: generarToken(usuario._id)
    });
  } catch (error) {
    console.error("ERROR REGISTRO:", error);
    res.status(500).json({ mensaje: "Error al registrar usuario" });
  }
};

// LOGIN
const loginUsuario = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ mensaje: "Email y contraseña son obligatorios" });
    }

    const emailNormalizado = email.toLowerCase().trim();
    const usuario = await Usuario.findOne({ email: emailNormalizado }).populate("sucursal");

    if (!usuario) {
      return res.status(401).json({ mensaje: "Credenciales incorrectas" });
    }

    if (usuario.activo === false) {
      return res.status(403).json({ mensaje: "Tu cuenta está desactivada. Contactá al administrador." });
    }

    const passwordCorrecto = await bcrypt.compare(password, usuario.password);
    if (!passwordCorrecto) {
      return res.status(401).json({ mensaje: "Credenciales incorrectas" });
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
    console.error("ERROR LOGIN:", error);
    res.status(500).json({ mensaje: "Error al iniciar sesión" });
  }
};

// PERFIL
const obtenerPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario._id)
      .select("-password")
      .populate("sucursal");
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener perfil" });
  }
};

// LISTAR TODOS (solo admin)
const listarUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find()
      .select("-password")
      .populate("sucursal", "zona numero direccion")
      .sort({ createdAt: -1 });

    res.json(usuarios);
  } catch (error) {
    console.error("ERROR LISTAR USUARIOS:", error);
    res.status(500).json({ mensaje: "Error al listar usuarios" });
  }
};

// CAMBIAR ROL (solo admin)
const cambiarRol = async (req, res) => {
  try {
    const { rol } = req.body;
    const rolesValidos = ["admin", "jefe"];

    if (!rolesValidos.includes(rol)) {
      return res.status(400).json({ mensaje: "Rol inválido" });
    }

    if (req.params.id === req.usuario._id.toString()) {
      return res.status(400).json({ mensaje: "No podés cambiar tu propio rol" });
    }

    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      { rol },
      { new: true, runValidators: true }
    ).select("-password").populate("sucursal", "zona numero");

    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    res.json({ mensaje: "Rol actualizado", usuario });
  } catch (error) {
    console.error("ERROR CAMBIAR ROL:", error);
    res.status(500).json({ mensaje: "Error al cambiar rol" });
  }
};

// CAMBIAR ESTADO (solo admin)
const cambiarEstado = async (req, res) => {
  try {
    const { activo } = req.body;

    if (typeof activo !== "boolean") {
      return res.status(400).json({ mensaje: "El campo activo debe ser true o false" });
    }

    if (req.params.id === req.usuario._id.toString()) {
      return res.status(400).json({ mensaje: "No podés desactivar tu propia cuenta" });
    }

    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      { activo },
      { new: true }
    ).select("-password").populate("sucursal", "zona numero");

    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    res.json({ mensaje: `Usuario ${activo ? "activado" : "desactivado"}`, usuario });
  } catch (error) {
    console.error("ERROR CAMBIAR ESTADO:", error);
    res.status(500).json({ mensaje: "Error al cambiar estado" });
  }
};

// CAMBIAR SUCURSAL (solo admin)
const cambiarSucursal = async (req, res) => {
  try {
    const { numeroSucursal } = req.body;

    if (numeroSucursal === undefined || numeroSucursal === null) {
      return res.status(400).json({ mensaje: "El número de sucursal es obligatorio" });
    }

    const sucursal = await Sucursal.findOne({ numero: Number(numeroSucursal) });

    if (!sucursal) {
      return res.status(404).json({ mensaje: "No existe una sucursal con ese número" });
    }

    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      { sucursal: sucursal._id },
      { new: true, runValidators: true }
    ).select("-password").populate("sucursal", "zona numero direccion");

    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    res.json({ mensaje: "Sucursal del usuario actualizada", usuario });
  } catch (error) {
    console.error("ERROR CAMBIAR SUCURSAL:", error);
    res.status(500).json({ mensaje: "Error al cambiar sucursal del usuario" });
  }
};

module.exports = {
  registrarUsuario,
  loginUsuario,
  obtenerPerfil,
  listarUsuarios,
  cambiarRol,
  cambiarEstado,
  cambiarSucursal
};
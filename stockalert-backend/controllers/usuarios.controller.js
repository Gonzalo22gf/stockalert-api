const logger = require("../utils/logger");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuario");
const Sucursal = require("../models/Sucursal");
const Empresa = require("../models/Empresa");
const { validarPassword } = require("../utils/validarPassword");

function generarCodigoAcceso(nombreEmpresa) {
  const prefijo = nombreEmpresa.toUpperCase().replace(/[^A-Z]/g, "").substring(0, 4).padEnd(4, "X");
  const numeros = Math.floor(1000 + Math.random() * 9000);
  return prefijo + "-" + numeros;
}

const generarToken = (id, empresa, pwv) => {
  return jwt.sign({ id, empresa, pwv: pwv || 0 }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// REGISTRO — dos modos:
//   modo "crear": nace una empresa nueva y el usuario es su admin
//   modo "unir": el usuario se suma a una empresa existente por su codigo de acceso
const registrarUsuario = async (req, res) => {
  try {
    const { nombre, email, password, modo, nombreEmpresa, numeroSucursal } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ mensaje: "Nombre, email y contrasena son obligatorios" });
    }
    const emailNormalizado = email.toLowerCase().trim();
    const errorPassword = validarPassword(password);
    if (errorPassword) return res.status(400).json({ mensaje: errorPassword });
    const usuarioExiste = await Usuario.findOne({ email: emailNormalizado });
    if (usuarioExiste) return res.status(400).json({ mensaje: "El usuario ya existe" });

    const salt = await bcrypt.genSalt(10);
    const passwordHasheado = await bcrypt.hash(password, salt);
    let empresa, sucursal, rolAsignado;

    if (modo === "crear") {
      if (!nombreEmpresa || !nombreEmpresa.trim()) {
        return res.status(400).json({ mensaje: "El nombre de la empresa es obligatorio" });
      }
      const codigo = generarCodigoAcceso(nombreEmpresa.trim());
      empresa = await Empresa.create({ nombre: nombreEmpresa.trim(), codigoAcceso: codigo });
      sucursal = await Sucursal.create({ zona: 1, numero: 1, direccion: "", empresa: empresa._id });
      rolAsignado = "admin";
    } else {
      if (!nombreEmpresa || !nombreEmpresa.trim()) {
        return res.status(400).json({ mensaje: "El codigo de acceso es obligatorio" });
      }
      empresa = await Empresa.findOne({ codigoAcceso: nombreEmpresa.trim().toUpperCase() });
      if (!empresa) {
        return res.status(400).json({ mensaje: "Codigo de acceso invalido. Pedile el codigo al administrador de la empresa." });
      }
      sucursal = await Sucursal.findOne({ numero: Number(numeroSucursal), empresa: empresa._id });
      if (!sucursal) {
        return res.status(400).json({ mensaje: "Esa sucursal no existe en la empresa indicada" });
      }
      rolAsignado = "jefe";
    }

    const usuario = await Usuario.create({
      nombre, email: emailNormalizado, password: passwordHasheado,
      rol: rolAsignado, sucursal: sucursal._id, empresa: empresa._id, activo: true
    });

    res.status(201).json({
      _id: usuario._id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol,
      empresa: { _id: empresa._id, nombre: empresa.nombre, codigoAcceso: empresa.codigoAcceso },
      sucursal: { _id: sucursal._id, zona: sucursal.zona, numero: sucursal.numero, direccion: sucursal.direccion },
      token: generarToken(usuario._id, empresa._id, 0)
    });
  } catch (error) {
    logger.error("ERROR REGISTRO:", error);
    res.status(500).json({ mensaje: "Error al registrar usuario" });
  }
};

// LOGIN
const loginUsuario = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ mensaje: "Email y contrasena son obligatorios" });
    }
    const emailNormalizado = email.toLowerCase().trim();
    const usuario = await Usuario.findOne({ email: emailNormalizado }).populate("sucursal").populate("empresa");
    if (!usuario) {
      return res.status(401).json({ mensaje: "Credenciales incorrectas" });
    }
    // Verificar bloqueo temporal
    if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
      const minutosRestantes = Math.ceil((usuario.bloqueadoHasta - new Date()) / 60000);
      return res.status(403).json({ mensaje: "Cuenta bloqueada temporalmente. Intentá de nuevo en " + minutosRestantes + " minuto(s)." });
    }
    if (usuario.activo === false) {
      return res.status(403).json({ mensaje: "Tu cuenta esta desactivada. Contacta al administrador." });
    }
    const passwordCorrecto = await bcrypt.compare(password, usuario.password);
    if (!passwordCorrecto) {
      // Incrementar intentos fallidos
      usuario.intentosFallidos = (usuario.intentosFallidos || 0) + 1;
      if (usuario.intentosFallidos >= 5) {
        usuario.bloqueadoHasta = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
        usuario.intentosFallidos = 0;
        await usuario.save();
        return res.status(403).json({ mensaje: "Demasiados intentos fallidos. Cuenta bloqueada 15 minutos." });
      }
      await usuario.save();
      return res.status(401).json({ mensaje: "Credenciales incorrectas" });
    }
    // Login exitoso: resetear contador
    usuario.intentosFallidos = 0;
    usuario.bloqueadoHasta = null;
    await usuario.save();
    res.json({
      _id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      empresa: usuario.empresa ? { _id: usuario.empresa._id, nombre: usuario.empresa.nombre } : null,
      sucursal: usuario.sucursal,
      token: generarToken(usuario._id, usuario.empresa ? usuario.empresa._id : null, usuario.passwordVersion || 0)
    });
  } catch (error) {
    logger.error("ERROR LOGIN:", error);
    res.status(500).json({ mensaje: "Error al iniciar sesion" });
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
    const usuarios = await Usuario.find({ empresa: req.empresaId })
      .select("-password")
      .populate("sucursal", "zona numero direccion")
      .sort({ createdAt: -1 });
    res.json(usuarios);
  } catch (error) {
    logger.error("ERROR LISTAR USUARIOS:", error);
    res.status(500).json({ mensaje: "Error al listar usuarios" });
  }
};

// CAMBIAR ROL (solo admin)
const cambiarRol = async (req, res) => {
  try {
    const { rol } = req.body;
    const rolesValidos = ["admin", "jefe"];
    if (!rolesValidos.includes(rol)) {
      return res.status(400).json({ mensaje: "Rol invalido" });
    }
    if (req.params.id === req.usuario._id.toString()) {
      return res.status(400).json({ mensaje: "No podes cambiar tu propio rol" });
    }
    const objetivo = await Usuario.findOne({ _id: req.params.id, empresa: req.empresaId });
    if (!objetivo) return res.status(404).json({ mensaje: "Usuario no encontrado" });
    objetivo.rol = rol;
    await objetivo.save();
    const usuario = await Usuario.findById(objetivo._id).select("-password").populate("sucursal", "zona numero");
    res.json({ mensaje: "Rol actualizado", usuario });
  } catch (error) {
    logger.error("ERROR CAMBIAR ROL:", error);
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
      return res.status(400).json({ mensaje: "No podes desactivar tu propia cuenta" });
    }
    const objetivo = await Usuario.findOne({ _id: req.params.id, empresa: req.empresaId });
    if (!objetivo) return res.status(404).json({ mensaje: "Usuario no encontrado" });
    objetivo.activo = activo;
    await objetivo.save();
    const usuario = await Usuario.findById(objetivo._id).select("-password").populate("sucursal", "zona numero");
    res.json({ mensaje: activo ? "Usuario activado" : "Usuario desactivado", usuario });
  } catch (error) {
    logger.error("ERROR CAMBIAR ESTADO:", error);
    res.status(500).json({ mensaje: "Error al cambiar estado" });
  }
};

// CAMBIAR SUCURSAL (solo admin)
const cambiarSucursal = async (req, res) => {
  try {
    const { numeroSucursal } = req.body;
    if (numeroSucursal === undefined || numeroSucursal === null) {
      return res.status(400).json({ mensaje: "El numero de sucursal es obligatorio" });
    }
    const objetivo = await Usuario.findOne({ _id: req.params.id, empresa: req.empresaId });
    if (!objetivo) return res.status(404).json({ mensaje: "Usuario no encontrado" });
    const sucursal = await Sucursal.findOne({ numero: Number(numeroSucursal), empresa: req.empresaId });
    if (!sucursal) return res.status(404).json({ mensaje: "No existe una sucursal con ese numero en tu empresa" });
    objetivo.sucursal = sucursal._id;
    await objetivo.save();
    const usuario = await Usuario.findById(objetivo._id).select("-password").populate("sucursal", "zona numero direccion");
    res.json({ mensaje: "Sucursal del usuario actualizada", usuario });
  } catch (error) {
    logger.error("ERROR CAMBIAR SUCURSAL:", error);
    res.status(500).json({ mensaje: "Error al cambiar sucursal del usuario" });
  }
};

// EDITAR DATOS DE USUARIO (solo admin)
const editarUsuarioAdmin = async (req, res) => {
  try {
    const objetivo = await Usuario.findOne({ _id: req.params.id, empresa: req.empresaId });
    if (!objetivo) return res.status(404).json({ mensaje: "Usuario no encontrado" });
    const { nombre, email, password } = req.body;
    const camposUpdate = {};
    if (nombre !== undefined) {
      if (!nombre.trim()) return res.status(400).json({ mensaje: "El nombre no puede estar vacio" });
      camposUpdate.nombre = nombre.trim();
    }
    if (email !== undefined) {
      const emailNormalizado = email.toLowerCase().trim();
      if (!emailNormalizado) return res.status(400).json({ mensaje: "El email no puede estar vacio" });
      const emailEnUso = await Usuario.findOne({ email: emailNormalizado, _id: { $ne: req.params.id } });
      if (emailEnUso) return res.status(400).json({ mensaje: "Ese email ya esta en uso" });
      camposUpdate.email = emailNormalizado;
    }
    if (password !== undefined && password !== "") {
      const errorPassword = validarPassword(password);
      if (errorPassword) return res.status(400).json({ mensaje: errorPassword });
      const salt = await bcrypt.genSalt(10);
      camposUpdate.password = await bcrypt.hash(password, salt);
      camposUpdate.passwordVersion = (objetivo.passwordVersion || 0) + 1;
    }
    if (Object.keys(camposUpdate).length === 0) {
      return res.status(400).json({ mensaje: "No se enviaron campos para actualizar" });
    }
    Object.assign(objetivo, camposUpdate);
    await objetivo.save();
    const usuario = await Usuario.findById(objetivo._id).select("-password").populate("sucursal", "zona numero direccion");
    res.json({ mensaje: "Usuario actualizado", usuario });
  } catch (error) {
    logger.error("ERROR EDITAR USUARIO:", error);
    res.status(500).json({ mensaje: "Error al editar usuario" });
  }
};

// ELIMINAR USUARIO (solo admin)
const eliminarUsuario = async (req, res) => {
  try {
    if (req.params.id === req.usuario._id.toString()) {
      return res.status(400).json({ mensaje: "No podes eliminar tu propia cuenta" });
    }
    const usuario = await Usuario.findOne({ _id: req.params.id, empresa: req.empresaId });
    if (!usuario) return res.status(404).json({ mensaje: "Usuario no encontrado" });
    if (usuario.rol === "admin") {
      const cantidadAdmins = await Usuario.countDocuments({ rol: "admin", empresa: req.empresaId });
      if (cantidadAdmins <= 1) {
        return res.status(400).json({ mensaje: "No se puede eliminar al unico administrador de la empresa." });
      }
    }
    await Usuario.findByIdAndDelete(usuario._id);
    res.json({ mensaje: "Usuario eliminado" });
  } catch (error) {
    logger.error("ERROR ELIMINAR USUARIO:", error);
    res.status(500).json({ mensaje: "Error al eliminar usuario" });
  }
};

module.exports = {
  registrarUsuario,
  loginUsuario,
  obtenerPerfil,
  listarUsuarios,
  cambiarRol,
  cambiarEstado,
  cambiarSucursal,
  editarUsuarioAdmin,
  eliminarUsuario
};

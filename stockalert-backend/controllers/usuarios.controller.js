const logger = require("../utils/logger");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuario");
const Sucursal = require("../models/Sucursal");
const Empresa = require("../models/Empresa");
const { validarPassword } = require("../utils/validarPassword");
const { ValidationError, NotFoundError, ForbiddenError, UnauthorizedError, ConflictError } = require("../utils/errors/AppError");

function generarCodigoAcceso(nombreEmpresa) {
  const prefijo = nombreEmpresa.toUpperCase().replace(/[^A-Z]/g, "").substring(0, 4).padEnd(4, "X");
  const numeros = Math.floor(1000 + Math.random() * 9000);
  return prefijo + "-" + numeros;
}

const generarToken = (id, empresa, pwv) => {
  return jwt.sign({ id, empresa, pwv: pwv || 0 }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const registrarUsuario = async (req, res, next) => {
  try {
    const { nombre, email, password, modo, nombreEmpresa, numeroSucursal } = req.body;
    if (!nombre || !email || !password) throw new ValidationError("Nombre, email y contrasena son obligatorios");
    const emailNormalizado = email.toLowerCase().trim();
    const errorPassword = validarPassword(password);
    if (errorPassword) throw new ValidationError(errorPassword);
    const usuarioExiste = await Usuario.findOne({ email: emailNormalizado });
    if (usuarioExiste) throw new ConflictError("El usuario ya existe");
    const salt = await bcrypt.genSalt(10);
    const passwordHasheado = await bcrypt.hash(password, salt);
    let empresa, sucursal, rolAsignado;
    if (modo === "crear") {
      if (!nombreEmpresa || !nombreEmpresa.trim()) throw new ValidationError("El nombre de la empresa es obligatorio");
      const codigo = generarCodigoAcceso(nombreEmpresa.trim());
      empresa = await Empresa.create({ nombre: nombreEmpresa.trim(), codigoAcceso: codigo });
      sucursal = await Sucursal.create({ zona: 1, numero: 1, direccion: "", empresa: empresa._id });
      rolAsignado = "admin";
    } else {
      if (!nombreEmpresa || !nombreEmpresa.trim()) throw new ValidationError("El codigo de acceso es obligatorio");
      empresa = await Empresa.findOne({ codigoAcceso: nombreEmpresa.trim().toUpperCase() });
      if (!empresa) throw new ValidationError("Codigo de acceso invalido. Pedile el codigo al administrador de la empresa.");
      sucursal = await Sucursal.findOne({ numero: Number(numeroSucursal), empresa: empresa._id });
      if (!sucursal) throw new ValidationError("Esa sucursal no existe en la empresa indicada");
      rolAsignado = "jefe";
    }
    const usuario = await Usuario.create({ nombre, email: emailNormalizado, password: passwordHasheado, rol: rolAsignado, sucursal: sucursal._id, empresa: empresa._id, activo: true });
    res.status(201).json({
      _id: usuario._id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol,
      empresa: { _id: empresa._id, nombre: empresa.nombre, codigoAcceso: empresa.codigoAcceso },
      sucursal: { _id: sucursal._id, zona: sucursal.zona, numero: sucursal.numero, direccion: sucursal.direccion },
      token: generarToken(usuario._id, empresa._id, 0)
    });
  } catch (error) {
    next(error);
  }
};

const loginUsuario = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new ValidationError("Email y contrasena son obligatorios");
    const emailNormalizado = email.toLowerCase().trim();
    const usuario = await Usuario.findOne({ email: emailNormalizado }).populate("sucursal").populate("empresa");
    if (!usuario) throw new UnauthorizedError("Credenciales incorrectas");
    if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
      const min = Math.ceil((usuario.bloqueadoHasta - new Date()) / 60000);
      throw new ForbiddenError("Cuenta bloqueada temporalmente. Intenta de nuevo en " + min + " minuto(s).");
    }
    if (!usuario.activo) throw new ForbiddenError("Tu cuenta esta desactivada. Contacta al administrador.");
    const passwordCorrecto = await bcrypt.compare(password, usuario.password);
    if (!passwordCorrecto) {
      usuario.intentosFallidos = (usuario.intentosFallidos || 0) + 1;
      if (usuario.intentosFallidos >= 5) {
        usuario.bloqueadoHasta = new Date(Date.now() + 15 * 60 * 1000);
        usuario.intentosFallidos = 0;
        await usuario.save();
        throw new ForbiddenError("Demasiados intentos fallidos. Cuenta bloqueada 15 minutos.");
      }
      await usuario.save();
      throw new UnauthorizedError("Credenciales incorrectas");
    }
    usuario.intentosFallidos = 0;
    usuario.bloqueadoHasta = null;
    await usuario.save();
    res.json({
      _id: usuario._id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol,
      empresa: usuario.empresa ? { _id: usuario.empresa._id, nombre: usuario.empresa.nombre } : null,
      sucursal: usuario.sucursal,
      token: generarToken(usuario._id, usuario.empresa ? usuario.empresa._id : null, usuario.passwordVersion || 0)
    });
  } catch (error) {
    next(error);
  }
};

const obtenerPerfil = async (req, res, next) => {
  try {
    const usuario = await Usuario.findById(req.usuario._id).select("-password").populate("sucursal");
    res.json(usuario);
  } catch (error) {
    next(error);
  }
};

const listarUsuarios = async (req, res, next) => {
  try {
    const usuarios = await Usuario.find({ empresa: req.empresaId })
      .select("-password").populate("sucursal", "zona numero direccion").sort({ createdAt: -1 });
    res.json(usuarios);
  } catch (error) {
    next(error);
  }
};

const cambiarRol = async (req, res, next) => {
  try {
    const { rol } = req.body;
    if (!["admin", "jefe"].includes(rol)) throw new ValidationError("Rol invalido");
    if (req.params.id === req.usuario._id.toString()) throw new ValidationError("No podes cambiar tu propio rol");
    const objetivo = await Usuario.findOne({ _id: req.params.id, empresa: req.empresaId });
    if (!objetivo) throw new NotFoundError("Usuario");
    objetivo.rol = rol;
    await objetivo.save();
    const usuario = await Usuario.findById(objetivo._id).select("-password").populate("sucursal", "zona numero");
    res.json({ mensaje: "Rol actualizado", usuario });
  } catch (error) {
    next(error);
  }
};

const cambiarEstado = async (req, res, next) => {
  try {
    const { activo } = req.body;
    if (typeof activo !== "boolean") throw new ValidationError("El campo activo debe ser true o false");
    if (req.params.id === req.usuario._id.toString()) throw new ValidationError("No podes desactivar tu propia cuenta");
    const objetivo = await Usuario.findOne({ _id: req.params.id, empresa: req.empresaId });
    if (!objetivo) throw new NotFoundError("Usuario");
    objetivo.activo = activo;
    await objetivo.save();
    const usuario = await Usuario.findById(objetivo._id).select("-password").populate("sucursal", "zona numero");
    res.json({ mensaje: activo ? "Usuario activado" : "Usuario desactivado", usuario });
  } catch (error) {
    next(error);
  }
};

const cambiarSucursal = async (req, res, next) => {
  try {
    const { numeroSucursal } = req.body;
    if (numeroSucursal === undefined || numeroSucursal === null) throw new ValidationError("El numero de sucursal es obligatorio");
    const objetivo = await Usuario.findOne({ _id: req.params.id, empresa: req.empresaId });
    if (!objetivo) throw new NotFoundError("Usuario");
    const sucursal = await Sucursal.findOne({ numero: Number(numeroSucursal), empresa: req.empresaId });
    if (!sucursal) throw new NotFoundError("Sucursal con ese numero en tu empresa");
    objetivo.sucursal = sucursal._id;
    await objetivo.save();
    const usuario = await Usuario.findById(objetivo._id).select("-password").populate("sucursal", "zona numero direccion");
    res.json({ mensaje: "Sucursal del usuario actualizada", usuario });
  } catch (error) {
    next(error);
  }
};

const editarUsuarioAdmin = async (req, res, next) => {
  try {
    const objetivo = await Usuario.findOne({ _id: req.params.id, empresa: req.empresaId });
    if (!objetivo) throw new NotFoundError("Usuario");
    const { nombre, email, password } = req.body;
    const camposUpdate = {};
    if (nombre !== undefined) {
      if (!nombre.trim()) throw new ValidationError("El nombre no puede estar vacio");
      camposUpdate.nombre = nombre.trim();
    }
    if (email !== undefined) {
      const emailNorm = email.toLowerCase().trim();
      if (!emailNorm) throw new ValidationError("El email no puede estar vacio");
      const enUso = await Usuario.findOne({ email: emailNorm, _id: { $ne: req.params.id } });
      if (enUso) throw new ConflictError("Ese email ya esta en uso por otro usuario");
      camposUpdate.email = emailNorm;
    }
    if (password !== undefined && password !== "") {
      const errorPassword = validarPassword(password);
      if (errorPassword) throw new ValidationError(errorPassword);
      const salt = await bcrypt.genSalt(10);
      camposUpdate.password = await bcrypt.hash(password, salt);
      camposUpdate.passwordVersion = (objetivo.passwordVersion || 0) + 1;
    }
    if (Object.keys(camposUpdate).length === 0) throw new ValidationError("No se enviaron campos para actualizar");
    Object.assign(objetivo, camposUpdate);
    await objetivo.save();
    const usuario = await Usuario.findById(objetivo._id).select("-password").populate("sucursal", "zona numero direccion");
    res.json({ mensaje: "Usuario actualizado", usuario });
  } catch (error) {
    next(error);
  }
};

const eliminarUsuario = async (req, res, next) => {
  try {
    if (req.params.id === req.usuario._id.toString()) throw new ValidationError("No podes eliminar tu propia cuenta");
    const usuario = await Usuario.findOne({ _id: req.params.id, empresa: req.empresaId });
    if (!usuario) throw new NotFoundError("Usuario");
    if (usuario.rol === "admin") {
      const cantidadAdmins = await Usuario.countDocuments({ rol: "admin", empresa: req.empresaId });
      if (cantidadAdmins <= 1) throw new ValidationError("No se puede eliminar al unico administrador de la empresa.");
    }
    await Usuario.findByIdAndDelete(usuario._id);
    res.json({ mensaje: "Usuario eliminado" });
  } catch (error) {
    next(error);
  }
};

module.exports = { registrarUsuario, loginUsuario, obtenerPerfil, listarUsuarios, cambiarRol, cambiarEstado, cambiarSucursal, editarUsuarioAdmin, eliminarUsuario };

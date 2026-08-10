const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const UsuarioRepository = require("../repositories/usuario.repository");
const SucursalRepository = require("../repositories/sucursal.repository");
const EmpresaRepository = require("../repositories/empresa.repository");
const { validarPassword } = require("../utils/validarPassword");
const { enviarCorreo } = require("./email");
const { templateVerificacionEmail } = require("./email-templates");
const { ValidationError, NotFoundError, ForbiddenError, UnauthorizedError, ConflictError } = require("../utils/errors/AppError");

// Sanitiza el nombre: solo letras, numeros, espacios y acentos
function sanitizarNombre(nombre) {
  return nombre.trim().replace(/[<>"'%;()&+]/g, "").substring(0, 80);
}

function generarCodigoAcceso(nombreEmpresa) {
  const prefijo = nombreEmpresa.toUpperCase().replace(/[^A-Z]/g, "").substring(0, 4).padEnd(4, "X");
  return prefijo + "-" + Math.floor(1000 + Math.random() * 9000);
}

function generarToken(id, empresa, pwv) {
  return jwt.sign({ id, empresa, pwv: pwv || 0 }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

const UsuarioService = {
  registrar: async ({ nombre, email, password, modo, nombreEmpresa, numeroSucursal }) => {
    const emailNormalizado = email.toLowerCase().trim();
    const nombreSanitizado = sanitizarNombre(nombre);
    if (!nombreSanitizado) throw new ValidationError("El nombre contiene caracteres invalidos");
    const errorPassword = validarPassword(password);
    if (errorPassword) throw new ValidationError(errorPassword);
    if (await UsuarioRepository.findByEmail(emailNormalizado)) throw new ConflictError("El usuario ya existe");
    const salt = await bcrypt.genSalt(10);
    const passwordHasheado = await bcrypt.hash(password, salt);
    let empresa, sucursal, rolAsignado;
    if (modo === "crear") {
      if (!nombreEmpresa?.trim()) throw new ValidationError("El nombre de la empresa es obligatorio");
      const Empresa = require("../models/Empresa");
      empresa = await Empresa.create({ nombre: nombreEmpresa.trim(), codigoAcceso: generarCodigoAcceso(nombreEmpresa.trim()) });
      sucursal = await SucursalRepository.create({ zona: 1, numero: 1, direccion: "", empresa: empresa._id });
      rolAsignado = "admin";
    } else {
      if (!nombreEmpresa?.trim()) throw new ValidationError("El codigo de acceso es obligatorio");
      empresa = await EmpresaRepository.findByCodigo(nombreEmpresa.trim());
      if (!empresa) throw new ValidationError("Codigo de acceso invalido. Pedile el codigo al administrador.");
      sucursal = await SucursalRepository.findByNumero(numeroSucursal, empresa._id);
      if (!sucursal) throw new ValidationError("Esa sucursal no existe en la empresa indicada");
      rolAsignado = "jefe";
    }
    const tokenVerificacion = crypto.randomBytes(32).toString("hex");
    const tokenVerificacionExpira = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const usuario = await UsuarioRepository.create({
      nombre: nombreSanitizado,
      email: emailNormalizado,
      password: passwordHasheado,
      rol: rolAsignado,
      sucursal: sucursal._id,
      empresa: empresa._id,
      activo: true,
      emailVerificado: false,
      tokenVerificacion,
      tokenVerificacionExpira
    });
    const linkVerificacion = (process.env.APP_URL || "https://app.mistockalert.com") + "/verificar-email?token=" + tokenVerificacion;
    enviarCorreo({
      para: emailNormalizado,
      asunto: "Verificá tu email — StockAlert",
      html: templateVerificacionEmail(nombreSanitizado, linkVerificacion)
    }).catch(() => {}); // No bloquear el registro si el correo falla
    return {
      _id: usuario._id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol,
      empresa: { _id: empresa._id, nombre: empresa.nombre, codigoAcceso: empresa.codigoAcceso },
      sucursal: { _id: sucursal._id, zona: sucursal.zona, numero: sucursal.numero, direccion: sucursal.direccion },
      token: generarToken(usuario._id, empresa._id, 0)
    };
  },

  login: async ({ email, password }) => {
    const emailNormalizado = email.toLowerCase().trim();
    const usuario = await UsuarioRepository.findByEmailConRelaciones(emailNormalizado);
    if (!usuario) throw new UnauthorizedError("Credenciales incorrectas");
    if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
      const min = Math.ceil((usuario.bloqueadoHasta - new Date()) / 60000);
      throw new ForbiddenError("Cuenta bloqueada temporalmente. Intenta de nuevo en " + min + " minuto(s).");
    }
    if (!usuario.activo) throw new ForbiddenError("Tu cuenta esta desactivada. Contacta al administrador.");
    if (usuario.emailVerificado === false) {
      throw new ForbiddenError("Debes verificar tu email antes de ingresar. Revisa tu correo y hace click en el link de activacion.");
    }
    const passwordCorrecto = await bcrypt.compare(password, usuario.password);
    if (!passwordCorrecto) {
      usuario.intentosFallidos = (usuario.intentosFallidos || 0) + 1;
      if (usuario.intentosFallidos >= 5) {
        usuario.bloqueadoHasta = new Date(Date.now() + 15 * 60 * 1000);
        usuario.intentosFallidos = 0;
        await UsuarioRepository.save(usuario);
        throw new ForbiddenError("Demasiados intentos fallidos. Cuenta bloqueada 15 minutos.");
      }
      await UsuarioRepository.save(usuario);
      throw new UnauthorizedError("Credenciales incorrectas");
    }
    usuario.intentosFallidos = 0;
    usuario.bloqueadoHasta = null;
    await UsuarioRepository.save(usuario);
    return {
      _id: usuario._id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol,
      empresa: usuario.empresa ? { _id: usuario.empresa._id, nombre: usuario.empresa.nombre } : null,
      sucursal: usuario.sucursal,
      token: generarToken(usuario._id, usuario.empresa?._id || null, usuario.passwordVersion || 0)
    };
  },

  obtenerPerfil: (usuarioId) => UsuarioRepository.findById(usuarioId),

  listar: (empresaId) => UsuarioRepository.findByEmpresa(empresaId),

  cambiarRol: async (id, empresaId, usuarioActualId, { rol }) => {
    if (id === usuarioActualId) throw new ValidationError("No podes cambiar tu propio rol");
    const objetivo = await UsuarioRepository.findOne({ _id: id, empresa: empresaId });
    if (!objetivo) throw new NotFoundError("Usuario");
    objetivo.rol = rol;
    await UsuarioRepository.save(objetivo);
    return UsuarioRepository.findById(objetivo._id);
  },

  cambiarEstado: async (id, empresaId, usuarioActualId, { activo }) => {
    if (id === usuarioActualId) throw new ValidationError("No podes desactivar tu propia cuenta");
    const objetivo = await UsuarioRepository.findOne({ _id: id, empresa: empresaId });
    if (!objetivo) throw new NotFoundError("Usuario");
    objetivo.activo = activo;
    await UsuarioRepository.save(objetivo);
    return UsuarioRepository.findById(objetivo._id);
  },

  cambiarSucursal: async (id, empresaId, { numeroSucursal }) => {
    const objetivo = await UsuarioRepository.findOne({ _id: id, empresa: empresaId });
    if (!objetivo) throw new NotFoundError("Usuario");
    const sucursal = await SucursalRepository.findByNumero(numeroSucursal, empresaId);
    if (!sucursal) throw new NotFoundError("Sucursal con ese numero en tu empresa");
    objetivo.sucursal = sucursal._id;
    await UsuarioRepository.save(objetivo);
    return UsuarioRepository.findById(objetivo._id);
  },

  editar: async (id, empresaId, { nombre, email, password }) => {
    const objetivo = await UsuarioRepository.findOne({ _id: id, empresa: empresaId });
    if (!objetivo) throw new NotFoundError("Usuario");
    const camposUpdate = {};
    if (nombre !== undefined) {
      if (!nombre.trim()) throw new ValidationError("El nombre no puede estar vacio");
      camposUpdate.nombre = nombre.trim();
    }
    if (email !== undefined) {
      const emailNorm = email.toLowerCase().trim();
      const enUso = await UsuarioRepository.findOne({ email: emailNorm, _id: { $ne: id } });
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
    Object.assign(objetivo, camposUpdate);
    await UsuarioRepository.save(objetivo);
    return UsuarioRepository.findById(objetivo._id);
  },

  verificarEmail: async (token) => {
    if (!token) throw new ValidationError("Token invalido");
    const usuario = await UsuarioRepository.findOne({ tokenVerificacion: token });
    if (!usuario) throw new ValidationError("El link de verificacion es invalido o ya fue usado");
    if (usuario.tokenVerificacionExpira < new Date()) throw new ValidationError("El link de verificacion expiro. Registrate de nuevo.");
    usuario.emailVerificado = true;
    usuario.tokenVerificacion = null;
    usuario.tokenVerificacionExpira = null;
    await UsuarioRepository.save(usuario);
    return { mensaje: "Email verificado correctamente. Ya podes iniciar sesion." };
  },

  eliminar: async (id, empresaId, usuarioActualId) => {
    if (id === usuarioActualId) throw new ValidationError("No podes eliminar tu propia cuenta");
    const usuario = await UsuarioRepository.findOne({ _id: id, empresa: empresaId });
    if (!usuario) throw new NotFoundError("Usuario");
    if (usuario.rol === "admin") {
      const cantidadAdmins = await UsuarioRepository.countAdmins(empresaId);
      if (cantidadAdmins <= 1) throw new ValidationError("No se puede eliminar al unico administrador de la empresa.");
    }
    await UsuarioRepository.delete(usuario._id);
    return { mensaje: "Usuario eliminado" };
  }
};

module.exports = UsuarioService;

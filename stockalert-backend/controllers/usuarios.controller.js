const UsuarioService = require("../services/usuario.service");

const registrarUsuario = async (req, res, next) => {
  try { res.status(201).json(await UsuarioService.registrar(req.body)); } catch (e) { next(e); }
};
const loginUsuario = async (req, res, next) => {
  try { res.json(await UsuarioService.login(req.body)); } catch (e) { next(e); }
};
const obtenerPerfil = async (req, res, next) => {
  try { res.json(await UsuarioService.obtenerPerfil(req.usuario._id)); } catch (e) { next(e); }
};
const listarUsuarios = async (req, res, next) => {
  try { res.json(await UsuarioService.listar(req.empresaId)); } catch (e) { next(e); }
};
const cambiarRol = async (req, res, next) => {
  try {
    const usuario = await UsuarioService.cambiarRol(req.params.id, req.empresaId, req.usuario._id.toString(), req.body);
    res.json({ mensaje: "Rol actualizado", usuario });
  } catch (e) { next(e); }
};
const cambiarEstado = async (req, res, next) => {
  try {
    const usuario = await UsuarioService.cambiarEstado(req.params.id, req.empresaId, req.usuario._id.toString(), req.body);
    res.json({ mensaje: req.body.activo ? "Usuario activado" : "Usuario desactivado", usuario });
  } catch (e) { next(e); }
};
const cambiarSucursal = async (req, res, next) => {
  try {
    const usuario = await UsuarioService.cambiarSucursal(req.params.id, req.empresaId, req.body);
    res.json({ mensaje: "Sucursal del usuario actualizada", usuario });
  } catch (e) { next(e); }
};
const editarUsuarioAdmin = async (req, res, next) => {
  try {
    const usuario = await UsuarioService.editar(req.params.id, req.empresaId, req.body);
    res.json({ mensaje: "Usuario actualizado", usuario });
  } catch (e) { next(e); }
};
const eliminarUsuario = async (req, res, next) => {
  try { res.json(await UsuarioService.eliminar(req.params.id, req.empresaId, req.usuario._id.toString())); } catch (e) { next(e); }
};
const verificarEmail = async (req, res, next) => {
  try { res.json(await UsuarioService.verificarEmail(req.query.token)); } catch (e) { next(e); }
};

module.exports = { registrarUsuario, loginUsuario, verificarEmail, obtenerPerfil, listarUsuarios, cambiarRol, cambiarEstado, cambiarSucursal, editarUsuarioAdmin, eliminarUsuario };

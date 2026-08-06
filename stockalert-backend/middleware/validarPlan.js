const Producto = require("../models/Producto");
const Sucursal = require("../models/Sucursal");
const Usuario = require("../models/Usuario");
const Empresa = require("../models/Empresa");
const { getLimites, TRIAL_DIAS } = require("../config/planes");

// Feature flag — cuando PLANES_HABILITADOS=false, todo pasa sin validacion
const PLANES_HABILITADOS = process.env.PLANES_HABILITADOS === "true";

// Chequea si el trial expiro
function trialExpirado(empresa) {
  if (!empresa.trialExpira) return false;
  return new Date() > new Date(empresa.trialExpira);
}

// Middleware: valida limite de productos antes de crear
async function validarLimiteProductos(req, res, next) {
  if (!PLANES_HABILITADOS) return next();
  try {
    const empresa = await Empresa.findById(req.empresaId);
    if (!empresa) return next();
    if (trialExpirado(empresa)) {
      return res.status(403).json({ mensaje: "Tu periodo de prueba expiro. Selecciona un plan para continuar.", codigo: "TRIAL_EXPIRADO" });
    }
    const limites = getLimites(empresa.plan);
    if (limites.productos === Infinity) return next();
    const cantidad = await Producto.countDocuments({ empresa: req.empresaId });
    if (cantidad >= limites.productos) {
      return res.status(403).json({ mensaje: "Alcanzaste el limite de productos de tu plan (" + limites.productos + "). Upgrade para continuar.", codigo: "LIMITE_PRODUCTOS" });
    }
    next();
  } catch (e) { next(e); }
}

// Middleware: valida limite de sucursales antes de crear
async function validarLimiteSucursales(req, res, next) {
  if (!PLANES_HABILITADOS) return next();
  try {
    const empresa = await Empresa.findById(req.empresaId);
    if (!empresa) return next();
    if (trialExpirado(empresa)) {
      return res.status(403).json({ mensaje: "Tu periodo de prueba expiro. Selecciona un plan para continuar.", codigo: "TRIAL_EXPIRADO" });
    }
    const limites = getLimites(empresa.plan);
    if (limites.sucursales === Infinity) return next();
    const cantidad = await Sucursal.countDocuments({ empresa: req.empresaId });
    if (cantidad >= limites.sucursales) {
      return res.status(403).json({ mensaje: "Alcanzaste el limite de sucursales de tu plan (" + limites.sucursales + "). Upgrade para continuar.", codigo: "LIMITE_SUCURSALES" });
    }
    next();
  } catch (e) { next(e); }
}

// Middleware: valida limite de usuarios antes de registrar
async function validarLimiteUsuarios(req, res, next) {
  if (!PLANES_HABILITADOS) return next();
  try {
    const empresaId = req.empresaId || req.body._empresaId;
    if (!empresaId) return next();
    const empresa = await Empresa.findById(empresaId);
    if (!empresa) return next();
    if (trialExpirado(empresa)) {
      return res.status(403).json({ mensaje: "Tu periodo de prueba expiro. Selecciona un plan para continuar.", codigo: "TRIAL_EXPIRADO" });
    }
    const limites = getLimites(empresa.plan);
    if (limites.usuarios === Infinity) return next();
    const cantidad = await Usuario.countDocuments({ empresa: empresaId });
    if (cantidad >= limites.usuarios) {
      return res.status(403).json({ mensaje: "Alcanzaste el limite de usuarios de tu plan (" + limites.usuarios + "). Upgrade para continuar.", codigo: "LIMITE_USUARIOS" });
    }
    next();
  } catch (e) { next(e); }
}

module.exports = { validarLimiteProductos, validarLimiteSucursales, validarLimiteUsuarios };

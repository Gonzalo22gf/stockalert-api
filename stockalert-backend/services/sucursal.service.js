const SucursalRepository = require("../repositories/sucursal.repository");
const ProductoRepository = require("../repositories/producto.repository");
const Producto = require("../models/Producto");
const { NotFoundError, ValidationError } = require("../utils/errors/AppError");

function calcularMetricas(productos) {
  const hoy = new Date();
  return {
    totalProductos: productos.length,
    vencidos: productos.filter((p) => new Date(p.vencimiento) < hoy).length,
    porVencer: productos.filter((p) => {
      const diff = Math.ceil((new Date(p.vencimiento) - hoy) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= 7;
    }).length,
    stockCritico: productos.filter((p) => p.stock > 0 && p.stock <= 5).length,
    agotados: productos.filter((p) => p.stock === 0).length,
    valorInventario: productos.reduce((t, p) => t + p.stock * p.precio, 0)
  };
}

function formatearSucursal(sucursal) {
  return {
    _id: sucursal._id,
    zona: sucursal.zona,
    numero: sucursal.numero,
    nombre: sucursal.nombre,
    direccion: sucursal.direccion,
    empresa: sucursal.empresa
  };
}

const SucursalService = {
  listar: (empresaId) =>
    SucursalRepository.findByEmpresa(empresaId),

  // Admin: resumen de todas las sucursales de la empresa
  resumen: async (empresaId) => {
    const sucursales = await SucursalRepository.findByEmpresa(empresaId);
    return Promise.all(sucursales.map(async (sucursal) => {
      const productos = await ProductoRepository.findByEmpresa(empresaId, { sucursal: sucursal._id });
      return { sucursal: formatearSucursal(sucursal), ...calcularMetricas(productos) };
    }));
  },

  // Jefe: resumen solo de su propia sucursal
  resumenPorSucursal: async (empresaId, sucursalId) => {
    const sucursal = await SucursalRepository.findById(sucursalId, empresaId);
    if (!sucursal) throw new NotFoundError("Sucursal");
    const productos = await ProductoRepository.findByEmpresa(empresaId, { sucursal: sucursal._id });
    return [{ sucursal: formatearSucursal(sucursal), ...calcularMetricas(productos) }];
  },

  crear: async (empresaId, { zona, numero, direccion }) => {
    const yaExiste = await SucursalRepository.findByNumero(numero, empresaId);
    if (yaExiste) throw new ValidationError("Ya existe una sucursal con ese numero en tu empresa");
    return SucursalRepository.create({
      zona: Number(zona), numero: Number(numero),
      direccion: direccion?.trim() || "", empresa: empresaId
    });
  },

  editar: async (id, empresaId, { zona, numero, direccion }) => {
    const existente = await SucursalRepository.findById(id, empresaId);
    if (!existente) throw new NotFoundError("Sucursal");
    if (Number(numero) !== existente.numero) {
      const choque = await SucursalRepository.findByNumero(numero, empresaId);
      if (choque && choque._id.toString() !== existente._id.toString())
        throw new ValidationError("Ya existe otra sucursal con ese numero");
    }
    existente.zona = Number(zona);
    existente.numero = Number(numero);
    existente.direccion = direccion?.trim() || "";
    return SucursalRepository.save(existente);
  },

  eliminar: async (id, empresaId) => {
    const sucursal = await SucursalRepository.findById(id, empresaId);
    if (!sucursal) throw new NotFoundError("Sucursal");
    const resultado = await Producto.deleteMany({ sucursal: sucursal._id, empresa: empresaId });
    await SucursalRepository.delete(sucursal._id);
    return { mensaje: "Sucursal eliminada", productosEliminados: resultado.deletedCount };
  }
};

module.exports = SucursalService;

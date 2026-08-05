const Sucursal = require("../models/Sucursal");

const SucursalRepository = {
  findByEmpresa: (empresaId) =>
    Sucursal.find({ empresa: empresaId }).sort({ numero: 1 }),

  findById: (id, empresaId) =>
    Sucursal.findOne({ _id: id, empresa: empresaId }),

  findByNumero: (numero, empresaId) =>
    Sucursal.findOne({ numero: Number(numero), empresa: empresaId }),

  create: (datos) => Sucursal.create(datos),

  save: (sucursal) => sucursal.save(),

  delete: (id) => Sucursal.findByIdAndDelete(id)
};

module.exports = SucursalRepository;

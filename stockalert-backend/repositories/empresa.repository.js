const Empresa = require("../models/Empresa");

const EmpresaRepository = {
  findById: (id) =>
    Empresa.findById(id).select("nombre codigoAcceso createdAt"),

  findByCodigo: (codigo) =>
    Empresa.findOne({ codigoAcceso: codigo.toUpperCase() }),

  findActivas: () =>
    Empresa.find({ activa: true }),

  create: (datos) => Empresa.create(datos)
};

module.exports = EmpresaRepository;

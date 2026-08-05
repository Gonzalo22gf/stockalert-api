const LinkFrecuente = require("../models/LinkFrecuente");

const LinkRepository = {
  findByEmpresa: (empresaId) =>
    LinkFrecuente.find({ empresa: empresaId }).sort({ orden: 1, createdAt: 1 }),

  findById: (id, empresaId) =>
    LinkFrecuente.findOne({ _id: id, empresa: empresaId }),

  count: (empresaId) =>
    LinkFrecuente.countDocuments({ empresa: empresaId }),

  create: (datos) => LinkFrecuente.create(datos),

  save: (link) => link.save(),

  delete: (id) => LinkFrecuente.findByIdAndDelete(id)
};

module.exports = LinkRepository;

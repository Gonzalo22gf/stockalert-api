const Usuario = require("../models/Usuario");

const UsuarioRepository = {
  findByEmail: (email) =>
    Usuario.findOne({ email }),

  findByEmailConRelaciones: (email) =>
    Usuario.findOne({ email }).populate("sucursal").populate("empresa"),

  findById: (id) =>
    Usuario.findById(id).select("-password").populate("sucursal"),

  findByEmpresa: (empresaId) =>
    Usuario.find({ empresa: empresaId })
      .select("-password")
      .populate("sucursal", "zona numero direccion")
      .sort({ createdAt: -1 }),

  findOne: (filtro) => Usuario.findOne(filtro),

  create: (datos) => Usuario.create(datos),

  save: (usuario) => usuario.save(),

  delete: (id) => Usuario.findByIdAndDelete(id),

  countAdmins: (empresaId) =>
    Usuario.countDocuments({ rol: "admin", empresa: empresaId })
};

module.exports = UsuarioRepository;

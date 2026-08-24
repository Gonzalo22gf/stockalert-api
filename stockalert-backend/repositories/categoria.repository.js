const Categoria = require("../models/Categoria");
const Producto = require("../models/Producto");
const CategoriaRepository = {
  findByEmpresa: (empresaId) =>
    Categoria.find({ empresa: empresaId }).sort({ nombre: 1 }),
  findById: (id, empresaId) =>
    Categoria.findOne({ _id: id, empresa: empresaId }),
  findByNombre: (nombre, empresaId) =>
    Categoria.findOne({ nombre: nombre.trim(), empresa: empresaId }),
  create: (datos) => Categoria.create(datos),
  save: (categoria) => categoria.save(),
  delete: (id) => Categoria.findByIdAndDelete(id),
  contarProductos: (nombre, empresaId) =>
    Producto.countDocuments({ categoria: nombre, empresa: empresaId }),
  reasignarProductos: (nombreViejo, nombreNuevo, empresaId) =>
    Producto.updateMany({ categoria: nombreViejo, empresa: empresaId }, { categoria: nombreNuevo })
};
module.exports = CategoriaRepository;

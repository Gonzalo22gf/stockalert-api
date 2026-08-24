const CategoriaService = require("../services/categoria.service");
const obtenerCategorias = async (req, res, next) => {
  try {
    res.json(await CategoriaService.listar(req.empresaId));
  } catch (e) { next(e); }
};
const crearCategoria = async (req, res, next) => {
  try {
    const categoria = await CategoriaService.crear(req.empresaId, req.body);
    res.status(201).json({ mensaje: "Categoria creada", categoria });
  } catch (e) { next(e); }
};
const editarCategoria = async (req, res, next) => {
  try {
    const categoria = await CategoriaService.editar(req.params.id, req.empresaId, req.body);
    res.json({ mensaje: "Categoria actualizada", categoria });
  } catch (e) { next(e); }
};
const eliminarCategoria = async (req, res, next) => {
  try {
    res.json(await CategoriaService.eliminar(req.params.id, req.empresaId, req.body));
  } catch (e) { next(e); }
};
module.exports = { obtenerCategorias, crearCategoria, editarCategoria, eliminarCategoria };

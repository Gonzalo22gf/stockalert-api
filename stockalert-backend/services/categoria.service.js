const CategoriaRepository = require("../repositories/categoria.repository");
const { NotFoundError, ValidationError, ConflictError } = require("../utils/errors/AppError");
const CategoriaService = {
  listar: (empresaId) =>
    CategoriaRepository.findByEmpresa(empresaId),
  crear: async (empresaId, { nombre }) => {
    const limpio = nombre?.trim();
    if (!limpio) throw new ValidationError("El nombre de la categoria es obligatorio");
    const yaExiste = await CategoriaRepository.findByNombre(limpio, empresaId);
    if (yaExiste) throw new ConflictError("Ya existe una categoria con ese nombre");
    return CategoriaRepository.create({ nombre: limpio, empresa: empresaId });
  },
  editar: async (id, empresaId, { nombre }) => {
    const categoria = await CategoriaRepository.findById(id, empresaId);
    if (!categoria) throw new NotFoundError("Categoria");
    const limpio = nombre?.trim();
    if (!limpio) throw new ValidationError("El nombre de la categoria es obligatorio");
    const nombreViejo = categoria.nombre;
    if (limpio === nombreViejo) return categoria;
    const choque = await CategoriaRepository.findByNombre(limpio, empresaId);
    if (choque && choque._id.toString() !== categoria._id.toString())
      throw new ConflictError("Ya existe otra categoria con ese nombre");
    categoria.nombre = limpio;
    const guardada = await CategoriaRepository.save(categoria);
    // Los productos guardan la categoria como string: hay que actualizarlos
    await CategoriaRepository.reasignarProductos(nombreViejo, limpio, empresaId);
    return guardada;
  },
  eliminar: async (id, empresaId, { reasignarA } = {}) => {
    const categoria = await CategoriaRepository.findById(id, empresaId);
    if (!categoria) throw new NotFoundError("Categoria");
    const cantidad = await CategoriaRepository.contarProductos(categoria.nombre, empresaId);
    if (cantidad > 0) {
      const destino = reasignarA?.trim();
      if (!destino) throw new ValidationError("La categoria tiene productos. Indica a que categoria reasignarlos.", "CATEGORIA_CON_PRODUCTOS");
      if (destino === categoria.nombre) throw new ValidationError("La categoria destino no puede ser la misma");
      const existeDestino = await CategoriaRepository.findByNombre(destino, empresaId);
      if (!existeDestino) throw new ValidationError("La categoria destino no existe");
      await CategoriaRepository.reasignarProductos(categoria.nombre, destino, empresaId);
    }
    await CategoriaRepository.delete(categoria._id);
    return { mensaje: "Categoria eliminada", productosReasignados: cantidad };
  }
};
module.exports = CategoriaService;

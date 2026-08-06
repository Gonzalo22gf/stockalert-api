const LinkRepository = require("../repositories/link.repository");
const { NotFoundError, ValidationError } = require("../utils/errors/AppError");

const LinkService = {
  listar: (empresaId) =>
    LinkRepository.findByEmpresa(empresaId),

  crear: async (empresaId, { nombre, url }) => {
    const cantidad = await LinkRepository.count(empresaId);
    if (cantidad >= 30) throw new ValidationError("Maximo 30 links por empresa");
    return LinkRepository.create({ nombre, url, empresa: empresaId, orden: cantidad });
  },

  editar: async (id, empresaId, { nombre, url }) => {
    const link = await LinkRepository.findById(id, empresaId);
    if (!link) throw new NotFoundError("Link");
    if (nombre) link.nombre = nombre.trim();
    if (url) link.url = url.trim();
    return LinkRepository.save(link);
  },

  borrar: async (id, empresaId) => {
    const link = await LinkRepository.findById(id, empresaId);
    if (!link) throw new NotFoundError("Link");
    await LinkRepository.delete(link._id);
    return { mensaje: "Link eliminado" };
  }
};

module.exports = LinkService;

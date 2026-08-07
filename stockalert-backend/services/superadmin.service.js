const Empresa = require("../models/Empresa");
const Usuario = require("../models/Usuario");
const Producto = require("../models/Producto");
const Sucursal = require("../models/Sucursal");

const SuperadminService = {
  // Metricas globales de toda la plataforma
  metricas: async () => {
    const [empresas, usuarios, productos, sucursales] = await Promise.all([
      Empresa.countDocuments(),
      Usuario.countDocuments(),
      Producto.countDocuments(),
      Sucursal.countDocuments()
    ]);
    const hace7dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [empresasNuevas, usuariosNuevos] = await Promise.all([
      Empresa.countDocuments({ createdAt: { $gte: hace7dias } }),
      Usuario.countDocuments({ createdAt: { $gte: hace7dias } })
    ]);
    return { empresas, usuarios, productos, sucursales, empresasNuevas, usuariosNuevos };
  },

  // Lista de empresas con sus metricas
  listarEmpresas: async () => {
    const empresas = await Empresa.find().sort({ createdAt: -1 }).lean();
    return Promise.all(empresas.map(async (empresa) => {
      const [usuarios, sucursales, productos] = await Promise.all([
        Usuario.countDocuments({ empresa: empresa._id }),
        Sucursal.countDocuments({ empresa: empresa._id }),
        Producto.countDocuments({ empresa: empresa._id })
      ]);
      const ultimoUsuario = await Usuario.findOne({ empresa: empresa._id })
        .sort({ updatedAt: -1 }).select("updatedAt").lean();
      return {
        _id: empresa._id,
        nombre: empresa.nombre,
        codigoAcceso: empresa.codigoAcceso,
        plan: empresa.plan || "business",
        activa: empresa.activa,
        creadaEl: empresa.createdAt,
        ultimaActividad: ultimoUsuario?.updatedAt || empresa.createdAt,
        usuarios,
        sucursales,
        productos
      };
    }));
  }
};

  // Desactiva/activa empresa - datos conservados
  toggleActiva: async (empresaId) => {
    const { NotFoundError } = require("../utils/errors/AppError");
    const empresa = await Empresa.findById(empresaId);
    if (!empresa) throw new NotFoundError("Empresa");
    empresa.activa = !empresa.activa;
    await empresa.save();
    return { _id: empresa._id, nombre: empresa.nombre, activa: empresa.activa };
  },

  // Elimina empresa y TODOS sus datos - irreversible
  eliminarTodo: async (empresaId) => {
    const { NotFoundError } = require("../utils/errors/AppError");
    const Movimiento = require("../models/Movimiento");
    const Snapshot = require("../models/Snapshot");
    const Link = require("../models/Link");
    const empresa = await Empresa.findById(empresaId);
    if (!empresa) throw new NotFoundError("Empresa");
    const nombre = empresa.nombre;
    await Promise.all([
      Usuario.deleteMany({ empresa: empresaId }),
      Producto.deleteMany({ empresa: empresaId }),
      Sucursal.deleteMany({ empresa: empresaId }),
      Movimiento.deleteMany({ empresa: empresaId }),
      Snapshot.deleteMany({ empresa: empresaId }),
      Link.deleteMany({ empresa: empresaId })
    ]);
    await Empresa.findByIdAndDelete(empresaId);
    return { mensaje: "Empresa eliminada", nombre };
  }
};

module.exports = SuperadminService;

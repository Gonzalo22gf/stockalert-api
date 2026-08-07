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

module.exports = SuperadminService;

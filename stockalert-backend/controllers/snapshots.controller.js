const logger = require("../utils/logger");
const Snapshot = require("../models/Snapshot");
const Sucursal = require("../models/Sucursal");
const Producto = require("../models/Producto");
const Empresa = require("../models/Empresa");
const { ForbiddenError } = require("../utils/errors/AppError");

const CATEGORIAS_FIJAS = ["Lácteos", "Bebidas", "Almacén", "Limpieza", "Congelados"];

function contarCategorias(productos) {
  const conteo = { "Lácteos": 0, "Bebidas": 0, "Almacén": 0, "Limpieza": 0, "Congelados": 0, "Otros": 0 };
  productos.forEach((p) => {
    if (CATEGORIAS_FIJAS.includes(p.categoria)) conteo[p.categoria]++;
    else conteo["Otros"]++;
  });
  return conteo;
}

function sumarCategorias(acc, cat) {
  const r = { ...acc };
  Object.keys(cat).forEach((k) => { r[k] = (r[k] || 0) + cat[k]; });
  return r;
}

function claveDia(fecha) {
  return fecha.toISOString().slice(0, 10);
}

async function calcularResumenEmpresa(empresaId) {
  const sucursales = await Sucursal.find({ empresa: empresaId }).sort({ numero: 1 });
  const hoy = new Date();
  const detalle = await Promise.all(
    sucursales.map(async (sucursal) => {
      const productos = await Producto.find({ sucursal: sucursal._id, empresa: empresaId });
      const totalProductos = productos.length;
      const vencidos = productos.filter((p) => new Date(p.vencimiento) < hoy).length;
      const porVencer = productos.filter((p) => {
        const diff = Math.ceil((new Date(p.vencimiento) - hoy) / (1000 * 60 * 60 * 24));
        return diff >= 0 && diff <= 7;
      }).length;
      const stockCritico = productos.filter((p) => p.stock > 0 && p.stock <= 5).length;
      const agotados = productos.filter((p) => p.stock === 0).length;
      const valorInventario = productos.reduce((t, p) => t + p.stock * p.precio, 0);
      const categorias = contarCategorias(productos);
      return { sucursalId: sucursal._id, nombre: sucursal.nombre, zona: sucursal.zona, numero: sucursal.numero, totalProductos, vencidos, porVencer, stockCritico, agotados, valorInventario, categorias };
    })
  );
  const categoriasVacias = { "Lácteos": 0, "Bebidas": 0, "Almacén": 0, "Limpieza": 0, "Congelados": 0, "Otros": 0 };
  const totales = detalle.reduce(
    (acc, s) => ({
      tiendas: acc.tiendas + 1,
      totalProductos: acc.totalProductos + s.totalProductos,
      vencidos: acc.vencidos + s.vencidos,
      porVencer: acc.porVencer + s.porVencer,
      stockCritico: acc.stockCritico + s.stockCritico,
      agotados: acc.agotados + s.agotados,
      valorInventario: acc.valorInventario + s.valorInventario,
      categorias: sumarCategorias(acc.categorias, s.categorias)
    }),
    { tiendas: 0, totalProductos: 0, vencidos: 0, porVencer: 0, stockCritico: 0, agotados: 0, valorInventario: 0, categorias: categoriasVacias }
  );
  return { detalle, totales };
}

const generarSnapshot = async (req, res, next) => {
  try {
    const empresas = await Empresa.find({ activa: true });
    const hoy = new Date();
    const dia = claveDia(hoy);
    const fechaMedianoche = new Date(dia + "T00:00:00.000Z");
    const resultados = [];
    for (const empresa of empresas) {
      const { detalle, totales } = await calcularResumenEmpresa(empresa._id);
      await Snapshot.findOneAndUpdate(
        { diaClave: dia, empresa: empresa._id },
        { fecha: fechaMedianoche, diaClave: dia, empresa: empresa._id, totales, sucursales: detalle },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      resultados.push({ empresa: empresa.nombre, dia });
    }
    res.json({ mensaje: "Snapshots generados", resultados });
  } catch (error) {
    next(error);
  }
};

const obtenerHistorico = async (req, res, next) => {
  try {
    if (req.usuario.rol !== "admin") throw new ForbiddenError();
    const { desde, hasta } = req.query;
    const filtro = { empresa: req.empresaId };
    if (desde || hasta) {
      filtro.fecha = {};
      if (desde) filtro.fecha.$gte = new Date(desde);
      if (hasta) filtro.fecha.$lte = new Date(hasta);
    }
    const snapshots = await Snapshot.find(filtro).sort({ fecha: 1 });
    res.json(snapshots);
  } catch (error) {
    next(error);
  }
};

module.exports = { generarSnapshot, obtenerHistorico };

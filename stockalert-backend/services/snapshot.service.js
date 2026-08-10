const Snapshot = require("../models/Snapshot");
const Sucursal = require("../models/Sucursal");
const Producto = require("../models/Producto");
const Empresa = require("../models/Empresa");

const CATEGORIAS_FIJAS = ["Lacteos", "Bebidas", "Almacen", "Limpieza", "Congelados"];

function contarCategorias(productos) {
  const conteo = { "Lacteos": 0, "Bebidas": 0, "Almacen": 0, "Limpieza": 0, "Congelados": 0, "Otros": 0 };
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

async function calcularResumenSucursal(sucursal, empresaId) {
  const hoy = new Date();
  const productos = await Producto.find({ sucursal: sucursal._id, empresa: empresaId });
  return {
    sucursalId: sucursal._id,
    nombre: sucursal.nombre,
    zona: sucursal.zona,
    numero: sucursal.numero,
    totalProductos: productos.length,
    vencidos: productos.filter((p) => new Date(p.vencimiento) < hoy).length,
    porVencer: productos.filter((p) => {
      const diff = Math.ceil((new Date(p.vencimiento) - hoy) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= 7;
    }).length,
    stockCritico: productos.filter((p) => p.stock > 0 && p.stock <= 5).length,
    agotados: productos.filter((p) => p.stock === 0).length,
    valorInventario: productos.reduce((t, p) => t + p.stock * p.precio, 0),
    categorias: contarCategorias(productos)
  };
}

async function calcularResumenEmpresa(empresaId) {
  const sucursales = await Sucursal.find({ empresa: empresaId }).sort({ numero: 1 });
  const detalle = await Promise.all(sucursales.map((s) => calcularResumenSucursal(s, empresaId)));
  const categoriasVacias = { "Lacteos": 0, "Bebidas": 0, "Almacen": 0, "Limpieza": 0, "Congelados": 0, "Otros": 0 };
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

async function guardarSnapshot(empresaId, nombreEmpresa) {
  const { detalle, totales } = await calcularResumenEmpresa(empresaId);
  const dia = claveDia(new Date());
  const fechaMedianoche = new Date(dia + "T00:00:00.000Z");
  await Snapshot.findOneAndUpdate(
    { diaClave: dia, empresa: empresaId },
    { fecha: fechaMedianoche, diaClave: dia, empresa: empresaId, totales, sucursales: detalle },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return { empresa: nombreEmpresa, dia };
}

async function obtenerSnapshotsPorFiltro(empresaId, { desde, hasta }) {
  const filtro = { empresa: empresaId };
  if (desde || hasta) {
    filtro.fecha = {};
    if (desde) filtro.fecha.$gte = new Date(desde);
    if (hasta) filtro.fecha.$lte = new Date(hasta);
  }
  return Snapshot.find(filtro).sort({ fecha: 1 });
}

module.exports = { guardarSnapshot, obtenerSnapshotsPorFiltro };

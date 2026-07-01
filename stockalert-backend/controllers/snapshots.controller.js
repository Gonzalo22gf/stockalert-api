const Snapshot = require("../models/Snapshot");
const Sucursal = require("../models/Sucursal");
const Producto = require("../models/Producto");

const CATEGORIAS_FIJAS = ["Lácteos", "Bebidas", "Almacén", "Limpieza", "Congelados"];

// Cuenta cuántos productos hay de cada categoría (las que no son fijas van a "Otros")
function contarCategorias(productos) {
  const conteo = { "Lácteos": 0, "Bebidas": 0, "Almacén": 0, "Limpieza": 0, "Congelados": 0, "Otros": 0 };
  productos.forEach((p) => {
    if (CATEGORIAS_FIJAS.includes(p.categoria)) {
      conteo[p.categoria]++;
    } else {
      conteo["Otros"]++;
    }
  });
  return conteo;
}

// Suma dos objetos de categorías (para acumular el total global)
function sumarCategorias(acc, cat) {
  const r = { ...acc };
  Object.keys(cat).forEach((k) => {
    r[k] = (r[k] || 0) + cat[k];
  });
  return r;
}

// Calcula el resumen actual de todas las sucursales (mismo criterio que el dashboard)
async function calcularResumenActual() {
  const sucursales = await Sucursal.find().sort({ numero: 1 });
  const hoy = new Date();

  const detalle = await Promise.all(
    sucursales.map(async (sucursal) => {
      const productos = await Producto.find({ sucursal: sucursal._id });
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

      return {
        sucursalId: sucursal._id,
        nombre: sucursal.nombre,
        zona: sucursal.zona,
        numero: sucursal.numero,
        totalProductos,
        vencidos,
        porVencer,
        stockCritico,
        agotados,
        valorInventario,
        categorias
      };
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

function claveDia(fecha) {
  return fecha.toISOString().slice(0, 10);
}

// GENERAR SNAPSHOT DEL DÍA (idempotente)
const generarSnapshot = async (req, res) => {
  try {
    const { detalle, totales } = await calcularResumenActual();
    const hoy = new Date();
    const dia = claveDia(hoy);
    const fechaMedianoche = new Date(dia + "T00:00:00.000Z");

    const snapshot = await Snapshot.findOneAndUpdate(
      { diaClave: dia },
      {
        fecha: fechaMedianoche,
        diaClave: dia,
        totales,
        sucursales: detalle
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ mensaje: "Snapshot generado", dia, snapshot });
  } catch (error) {
    console.error("ERROR GENERAR SNAPSHOT:", error);
    res.status(500).json({ mensaje: "Error al generar snapshot" });
  }
};

// LISTAR SNAPSHOTS en un rango de fechas (solo admin)
const obtenerHistorico = async (req, res) => {
  try {
    if (req.usuario.rol !== "admin") {
      return res.status(403).json({ mensaje: "No autorizado" });
    }

    const { desde, hasta } = req.query;
    const filtro = {};
    if (desde || hasta) {
      filtro.fecha = {};
      if (desde) filtro.fecha.$gte = new Date(desde);
      if (hasta) filtro.fecha.$lte = new Date(hasta);
    }

    const snapshots = await Snapshot.find(filtro).sort({ fecha: 1 });
    res.json(snapshots);
  } catch (error) {
    console.error("ERROR HISTORICO:", error);
    res.status(500).json({ mensaje: "Error al obtener histórico" });
  }
};

module.exports = {
  generarSnapshot,
  obtenerHistorico
};

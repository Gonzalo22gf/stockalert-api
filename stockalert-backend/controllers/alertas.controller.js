const logger = require("../utils/logger");
const Producto = require("../models/Producto");
const Usuario = require("../models/Usuario");
const Sucursal = require("../models/Sucursal");
const Empresa = require("../models/Empresa");
const { enviarCorreo } = require("../services/email");
const { templateJefe, templateAdmin } = require("../services/email-templates");
const PushService = require("../services/push.service");

function clasificar(productos) {
  const hoy = new Date();
  const limite = new Date();
  limite.setDate(hoy.getDate() + 7);
  const vencidos = [], porVencer = [], stockCritico = [], agotados = [];
  for (const p of productos) {
    const fecha = new Date(p.vencimiento);
    if (fecha < hoy) vencidos.push(p);
    else if (fecha <= limite) porVencer.push(p);
    const stock = Number(p.stock) || 0;
    if (stock === 0) agotados.push(p);
    else if (stock <= 5) stockCritico.push(p);
  }
  return { vencidos, porVencer, stockCritico, agotados };
}

function nombreSucursal(s) {
  return "Zona " + s.zona + ", " + s.numero;
}

function calcularRanking(sucursales, productos) {
  return sucursales
    .map((s) => {
      const propios = productos.filter((p) => String(p.sucursal) === String(s._id));
      const r = clasificar(propios);
      return {
        nombre: nombreSucursal(s),
        vencidos: r.vencidos.length,
        porVencer: r.porVencer.length,
        stockCritico: r.stockCritico.length,
        agotados: r.agotados.length,
        sucursal: s,
        resumen: r
      };
    })
    .filter((t) => t.vencidos + t.porVencer + t.stockCritico + t.agotados > 0)
    .sort((a, b) => b.vencidos - a.vencidos || b.porVencer - a.porVencer || b.stockCritico - a.stockCritico);
}

async function notificarAdmin(admin, ranking, nombreEmpresa) {
  if (!admin.email) return { ok: false };
  try {
    await enviarCorreo({
      para: admin.email,
      asunto: "StockAlert - Top 10 tiendas en riesgo",
      html: templateAdmin(ranking.slice(0, 10), nombreEmpresa)
    });
    const resumenPush = ranking.length > 0
      ? ranking[0].nombre + " tiene " + ranking[0].vencidos + " vencidos"
      : "Sin alertas criticas hoy";
    await PushService.notificarUsuario(admin._id, "StockAlert - Alertas diarias", resumenPush).catch(() => {});
    return { ok: true };
  } catch (e) {
    logger.error("Fallo notificacion a admin " + admin.email + ":", e.message);
    return { ok: false };
  }
}

async function notificarJefe(jefe, datosSucursal) {
  if (!jefe.sucursal?._id || !jefe.email) return { ok: false };
  try {
    await enviarCorreo({
      para: jefe.email,
      asunto: "StockAlert - Parte diario de tu tienda",
      html: templateJefe(datosSucursal.sucursal, datosSucursal.resumen)
    });
    const r = datosSucursal.resumen;
    const hayProblemas = r.vencidos.length + r.porVencer.length + r.stockCritico.length > 0;
    if (hayProblemas) {
      const msg = r.vencidos.length + " vencidos, " + r.porVencer.length + " por vencer, " + r.stockCritico.length + " stock critico";
      await PushService.notificarUsuario(jefe._id, "StockAlert - Parte de tu tienda", msg).catch(() => {});
    }
    return { ok: true };
  } catch (e) {
    logger.error("Fallo notificacion a jefe " + jefe.email + ":", e.message);
    return { ok: false };
  }
}

async function procesarEmpresa(empresa) {
  const [sucursales, productos, jefes, admins] = await Promise.all([
    Sucursal.find({ empresa: empresa._id }),
    Producto.find({ empresa: empresa._id }),
    Usuario.find({ rol: "jefe", activo: { $ne: false }, empresa: empresa._id }).populate("sucursal"),
    Usuario.find({ rol: "admin", activo: { $ne: false }, empresa: empresa._id })
  ]);

  const ranking = calcularRanking(sucursales, productos);
  const porSucursalId = Object.fromEntries(
    ranking.map((r) => [String(r.sucursal._id), r])
  );

  const resultadosAdmin = await Promise.all(admins.map((a) => notificarAdmin(a, ranking, empresa.nombre)));
  const resultadosJefe = await Promise.all(
    jefes.map((j) => notificarJefe(j, porSucursalId[String(j.sucursal?._id)]))
  );

  return {
    empresa: empresa.nombre,
    correosAdmins: resultadosAdmin.filter((r) => r.ok).length,
    correosJefes: resultadosJefe.filter((r) => r.ok).length,
    fallidos: [...resultadosAdmin, ...resultadosJefe].filter((r) => !r.ok).length
  };
}

const enviarAlertasDiarias = async (req, res, next) => {
  try {
    const empresas = await Empresa.find({ activa: true });
    const resultados = await Promise.all(empresas.map(procesarEmpresa));
    logger.info("Alertas diarias enviadas: " + resultados.length + " empresas procesadas");
    res.json({ mensaje: "Alertas diarias enviadas", resultados });
  } catch (error) {
    next(error);
  }
};

module.exports = { enviarAlertasDiarias, clasificar };

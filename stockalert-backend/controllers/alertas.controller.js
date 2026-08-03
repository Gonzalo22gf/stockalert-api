const logger = require("../utils/logger");
const Producto = require("../models/Producto");
const Usuario = require("../models/Usuario");
const Sucursal = require("../models/Sucursal");
const Empresa = require("../models/Empresa");
const { enviarCorreo } = require("../services/email");

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

function nombreSucursal(s) { return "Zona " + s.zona + ", " + s.numero; }
function fmtFecha(f) { return new Date(f).toLocaleDateString("es-AR"); }

function htmlJefe(sucursal, r) {
  const todoOk = r.vencidos.length === 0 && r.porVencer.length === 0 && r.stockCritico.length === 0 && r.agotados.length === 0;
  let html = "<div style='font-family:sans-serif;max-width:560px'>";
  html += "<h2>Parte diario de tu tienda - StockAlert</h2>";
  html += "<p><b>Sucursal:</b> " + nombreSucursal(sucursal) + "</p><hr>";
  if (todoOk) {
    html += "<p>OK - sin productos vencidos ni stock critico. Tu tienda esta impecable.</p>";
  } else {
    html += "<p>Vencidos: " + r.vencidos.length + "</p>";
    html += "<p>Por vencer (7 dias): " + r.porVencer.length + "</p>";
    html += "<p>Stock critico: " + r.stockCritico.length + "</p>";
    html += "<p>Agotados: " + r.agotados.length + "</p><hr>";
    if (r.vencidos.length > 0) {
      html += "<h3>Vencidos (retirar de gondola)</h3><ul>";
      r.vencidos.forEach((p) => { html += "<li>" + p.nombre + " - vencio el " + fmtFecha(p.vencimiento) + " - stock: " + p.stock + "</li>"; });
      html += "</ul>";
    }
    if (r.porVencer.length > 0) {
      html += "<h3>Por vencer (priorizar venta)</h3><ul>";
      r.porVencer.forEach((p) => { html += "<li>" + p.nombre + " - vence el " + fmtFecha(p.vencimiento) + " - stock: " + p.stock + "</li>"; });
      html += "</ul>";
    }
    if (r.stockCritico.length > 0) {
      html += "<h3>Stock critico (reponer)</h3><ul>";
      r.stockCritico.forEach((p) => { html += "<li>" + p.nombre + " - quedan " + p.stock + "</li>"; });
      html += "</ul>";
    }
    if (r.agotados.length > 0) {
      html += "<h3>Agotados</h3><ul>";
      r.agotados.forEach((p) => { html += "<li>" + p.nombre + "</li>"; });
      html += "</ul>";
    }
  }
  html += "<hr><p style='color:#888;font-size:12px'>Aviso automatico de StockAlert.</p></div>";
  return html;
}

function htmlAdmin(ranking, nombreEmpresa) {
  let html = "<div style='font-family:sans-serif;max-width:560px'>";
  html += "<h2>Top 10 tiendas en riesgo - " + nombreEmpresa + " - StockAlert</h2>";
  html += "<hr>";
  if (ranking.length === 0) {
    html += "<p>Ninguna tienda tiene riesgos hoy. Todo en orden.</p>";
  } else {
    ranking.forEach((t, i) => {
      html += "<p><b>" + (i + 1) + ". " + t.nombre + "</b><br>";
      html += "Vencidos: <b>" + t.vencidos + "</b> - Por vencer: <b>" + t.porVencer + "</b> - Stock critico: <b>" + t.stockCritico + "</b> - Agotados: <b>" + t.agotados + "</b></p>";
    });
  }
  html += "<hr><p style='color:#888;font-size:12px'>Aviso automatico de StockAlert.</p></div>";
  return html;
}

// Procesa alertas de UNA empresa
async function procesarEmpresa(empresa) {
  const [sucursales, productos, jefes, admins] = await Promise.all([
    Sucursal.find({ empresa: empresa._id }),
    Producto.find({ empresa: empresa._id }),
    Usuario.find({ rol: "jefe", activo: { $ne: false }, empresa: empresa._id }).populate("sucursal"),
    Usuario.find({ rol: "admin", activo: { $ne: false }, empresa: empresa._id })
  ]);

  const porSucursal = new Map();
  for (const s of sucursales) {
    const propios = productos.filter((p) => String(p.sucursal) === String(s._id));
    porSucursal.set(String(s._id), { sucursal: s, resumen: clasificar(propios) });
  }

  const ranking = [...porSucursal.values()]
    .map(({ sucursal, resumen }) => ({
      nombre: nombreSucursal(sucursal),
      vencidos: resumen.vencidos.length,
      porVencer: resumen.porVencer.length,
      stockCritico: resumen.stockCritico.length,
      agotados: resumen.agotados.length
    }))
    .filter((t) => t.vencidos + t.porVencer + t.stockCritico + t.agotados > 0)
    .sort((a, b) => b.vencidos - a.vencidos || b.porVencer - a.porVencer || b.stockCritico - a.stockCritico)
    .slice(0, 10);

  let correosAdmins = 0, correosJefes = 0, fallidos = 0;

  for (const admin of admins) {
    if (!admin.email) continue;
    try {
      await enviarCorreo({ para: admin.email, asunto: "StockAlert - Top 10 tiendas en riesgo", html: htmlAdmin(ranking, empresa.nombre) });
      correosAdmins++;
    } catch (e) {
      logger.error("Fallo correo a admin " + admin.email + ":", e.message);
      fallidos++;
    }
  }

  for (const jefe of jefes) {
    if (!jefe.sucursal?._id || !jefe.email) continue;
    const datos = porSucursal.get(String(jefe.sucursal._id));
    if (!datos) continue;
    try {
      await enviarCorreo({ para: jefe.email, asunto: "StockAlert - Parte diario de tu tienda", html: htmlJefe(datos.sucursal, datos.resumen) });
      correosJefes++;
    } catch (e) {
      logger.error("Fallo correo a jefe " + jefe.email + ":", e.message);
      fallidos++;
    }
  }

  return { empresa: empresa.nombre, correosAdmins, correosJefes, fallidos };
}

// ENVIAR ALERTAS DIARIAS — recorre TODAS las empresas activas
const enviarAlertasDiarias = async (req, res) => {
  try {
    const empresas = await Empresa.find({ activa: true });
    const resultados = [];
    for (const empresa of empresas) {
      const r = await procesarEmpresa(empresa);
      resultados.push(r);
    }
    logger.info("Alertas diarias enviadas: " + resultados.length + " empresas procesadas");
    res.json({ mensaje: "Alertas diarias enviadas", resultados });
  } catch (error) {
    logger.error("ERROR ALERTAS DIARIAS:", error);
    res.status(500).json({ mensaje: "Error al enviar alertas diarias" });
  }
};

module.exports = { enviarAlertasDiarias, clasificar };

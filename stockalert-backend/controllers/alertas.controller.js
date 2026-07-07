const Producto = require("../models/Producto");
const Usuario = require("../models/Usuario");
const Sucursal = require("../models/Sucursal");
const { enviarCorreo } = require("../services/email");

// Clasifica una lista de productos en categorias de riesgo
function clasificar(productos) {
  const hoy = new Date();
  const limite = new Date();
  limite.setDate(hoy.getDate() + 7);
  const vencidos = [];
  const porVencer = [];
  const stockCritico = [];
  const agotados = [];
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

function fmtFecha(f) {
  return new Date(f).toLocaleDateString("es-AR");
}

// HTML del correo para un JEFE (su tienda)
function htmlJefe(sucursal, r) {
  const todoOk = r.vencidos.length === 0 && r.porVencer.length === 0 && r.stockCritico.length === 0 && r.agotados.length === 0;
  let html = "<div style='font-family:sans-serif;max-width:560px'>";
  html += "<h2>📋 Parte diario de tu tienda - StockAlert</h2>";
  html += "<p><b>Sucursal:</b> " + nombreSucursal(sucursal) + "</p><hr>";
  if (todoOk) {
    html += "<p style='font-size:15px'>✅ <b>Vencimientos:</b> OK - sin productos vencidos</p>";
    html += "<p style='font-size:15px'>✅ <b>Por vencer (7 dias):</b> OK - nada proximo a vencer</p>";
    html += "<p style='font-size:15px'>✅ <b>Stock:</b> OK - sin faltantes ni stock critico</p>";
    html += "<p style='color:#16a34a'><b>Tu tienda esta impecable. ¡Buen trabajo!</b></p>";
  } else {
    html += "<p>🔴 <b>Vencidos:</b> " + r.vencidos.length + "</p>";
    html += "<p>🟡 <b>Por vencer (7 dias):</b> " + r.porVencer.length + "</p>";
    html += "<p>🟣 <b>Stock critico:</b> " + r.stockCritico.length + "</p>";
    html += "<p>🚫 <b>Agotados:</b> " + r.agotados.length + "</p><hr>";
    if (r.vencidos.length > 0) {
      html += "<h3>🔴 Vencidos (retirar de gondola)</h3><ul>";
      r.vencidos.forEach((p) => { html += "<li>" + p.nombre + " - vencio el " + fmtFecha(p.vencimiento) + " - stock: " + p.stock + "</li>"; });
      html += "</ul>";
    }
    if (r.porVencer.length > 0) {
      html += "<h3>🟡 Por vencer (priorizar venta)</h3><ul>";
      r.porVencer.forEach((p) => { html += "<li>" + p.nombre + " - vence el " + fmtFecha(p.vencimiento) + " - stock: " + p.stock + "</li>"; });
      html += "</ul>";
    }
    if (r.stockCritico.length > 0) {
      html += "<h3>🟣 Stock critico (reponer)</h3><ul>";
      r.stockCritico.forEach((p) => { html += "<li>" + p.nombre + " - quedan " + p.stock + "</li>"; });
      html += "</ul>";
    }
    if (r.agotados.length > 0) {
      html += "<h3>🚫 Agotados</h3><ul>";
      r.agotados.forEach((p) => { html += "<li>" + p.nombre + "</li>"; });
      html += "</ul>";
    }
  }
  html += "<hr><p style='color:#888;font-size:12px'>Aviso automatico de StockAlert.</p></div>";
  return html;
}

// HTML del correo para los ADMINS (top 10 tiendas en riesgo)
function htmlAdmin(ranking) {
  let html = "<div style='font-family:sans-serif;max-width:560px'>";
  html += "<h2>🚨 Top 10 tiendas en riesgo - StockAlert</h2>";
  html += "<p>Ranking diario ordenado por productos vencidos, por vencer y stock critico:</p><hr>";
  if (ranking.length === 0) {
    html += "<p style='color:#16a34a'>✅ <b>Ninguna tienda tiene riesgos hoy. Todo en orden.</b></p>";
  } else {
    ranking.forEach((t, i) => {
      html += "<p style='margin:10px 0'><b>" + (i + 1) + ". " + t.nombre + "</b><br>";
      html += "🔴 Vencidos: <b>" + t.vencidos + "</b> · 🟡 Por vencer: <b>" + t.porVencer + "</b> · 🟣 Stock critico: <b>" + t.stockCritico + "</b> · 🚫 Agotados: <b>" + t.agotados + "</b></p>";
    });
  }
  html += "<hr><p style='color:#888;font-size:12px'>Aviso automatico de StockAlert.</p></div>";
  return html;
}

const enviarAlertasDiarias = async (req, res) => {
  try {
    // Traemos todo de una: sucursales, productos, jefes y admins activos
    const [sucursales, productos, jefes, admins] = await Promise.all([
      Sucursal.find(),
      Producto.find(),
      Usuario.find({ rol: "jefe", activo: { $ne: false } }).populate("sucursal"),
      Usuario.find({ rol: "admin", activo: { $ne: false } })
    ]);

    // Agrupamos productos por sucursal y clasificamos
    const porSucursal = new Map();
    for (const s of sucursales) {
      const propios = productos.filter((p) => String(p.sucursal) === String(s._id));
      porSucursal.set(String(s._id), { sucursal: s, resumen: clasificar(propios) });
    }

    // Ranking: top 10 tiendas con riesgo, ordenadas
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

    let correosAdmins = 0;
    let correosJefes = 0;
    let fallidos = 0;

    // ── Correo a CADA ADMIN registrado: el top 10 ──
    for (const admin of admins) {
      if (!admin.email) continue;
      try {
        await enviarCorreo({
          para: admin.email,
          asunto: "StockAlert - Top 10 tiendas en riesgo",
          html: htmlAdmin(ranking)
        });
        correosAdmins++;
      } catch (e) {
        console.error("Fallo correo a admin " + admin.email + ":", e.message);
        fallidos++;
      }
    }

    // ── Correo a CADA JEFE: el estado de SU tienda (siempre, este bien o mal) ──
    for (const jefe of jefes) {
      if (!jefe.sucursal?._id || !jefe.email) continue;
      const datos = porSucursal.get(String(jefe.sucursal._id));
      if (!datos) continue;
      try {
        await enviarCorreo({
          para: jefe.email,
          asunto: "StockAlert - Parte diario de tu tienda",
          html: htmlJefe(datos.sucursal, datos.resumen)
        });
        correosJefes++;
      } catch (e) {
        console.error("Fallo correo a jefe " + jefe.email + ":", e.message);
        fallidos++;
      }
    }

    res.json({ mensaje: "Alertas diarias enviadas", correosAdmins, correosJefes, fallidos });
  } catch (error) {
    console.error("ERROR ALERTAS DIARIAS:", error);
    res.status(500).json({ mensaje: "Error al enviar alertas diarias" });
  }
};

module.exports = { enviarAlertasDiarias };

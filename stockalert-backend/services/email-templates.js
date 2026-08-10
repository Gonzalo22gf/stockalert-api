// Responsabilidad única: generar HTML para los correos de alertas.
// No contiene lógica de negocio ni acceso a datos.

function nombreSucursal(s) {
  return "Zona " + s.zona + ", " + s.numero;
}

function fmtFecha(f) {
  return new Date(f).toLocaleDateString("es-AR");
}

function templateJefe(sucursal, resumen) {
  const { vencidos, porVencer, stockCritico, agotados } = resumen;
  const todoOk = vencidos.length === 0 && porVencer.length === 0 && stockCritico.length === 0 && agotados.length === 0;

  const filaProductos = (lista) => lista
    .map((p) => "<li>" + p.nombre + " - " + fmtFecha(p.vencimiento) + " - stock: " + p.stock + "</li>")
    .join("");

  const seccion = (titulo, lista) => lista.length > 0
    ? "<h3>" + titulo + "</h3><ul>" + filaProductos(lista) + "</ul>"
    : "";

  const cuerpo = todoOk
    ? "<p>OK - sin productos vencidos ni stock critico.</p>"
    : [
        "<p>Vencidos: " + vencidos.length + "</p>",
        "<p>Por vencer (7 dias): " + porVencer.length + "</p>",
        "<p>Stock critico: " + stockCritico.length + "</p>",
        "<p>Agotados: " + agotados.length + "</p><hr>",
        seccion("Vencidos", vencidos),
        seccion("Por vencer", porVencer),
        seccion("Stock critico", stockCritico),
        seccion("Agotados", agotados)
      ].join("");

  return "<div style='font-family:sans-serif;max-width:560px'>" +
    "<h2>Parte diario de tu tienda - StockAlert</h2>" +
    "<p><b>Sucursal:</b> " + nombreSucursal(sucursal) + "</p><hr>" +
    cuerpo +
    "<hr><p style='color:#888;font-size:12px'>Aviso automatico de StockAlert.</p></div>";
}

function templateAdmin(ranking, nombreEmpresa) {
  const filas = ranking.length === 0
    ? "<p>Ninguna tienda tiene riesgos hoy.</p>"
    : ranking.map((t, i) =>
        "<p><b>" + (i + 1) + ". " + t.nombre + "</b><br>" +
        "Vencidos: <b>" + t.vencidos + "</b> - " +
        "Por vencer: <b>" + t.porVencer + "</b> - " +
        "Stock critico: <b>" + t.stockCritico + "</b> - " +
        "Agotados: <b>" + t.agotados + "</b></p>"
      ).join("");

  return "<div style='font-family:sans-serif;max-width:560px'>" +
    "<h2>Top 10 tiendas en riesgo - " + nombreEmpresa + " - StockAlert</h2><hr>" +
    filas +
    "<hr><p style='color:#888;font-size:12px'>Aviso automatico de StockAlert.</p></div>";
}

module.exports = { templateJefe, templateAdmin };

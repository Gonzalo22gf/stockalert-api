// Funciones puras para logica de productos.
// Sin estado, sin efectos secundarios, sin dependencias de React.


export function estadoVencimiento(vencimiento) {
  const dias = Math.ceil((new Date(vencimiento) - new Date()) / (1000 * 60 * 60 * 24));
  if (dias < 0) return "vencido";
  if (dias <= 7) return "por-vencer";
  return "buen-estado";
}

export function filtrarProductos(productos, { busqueda, filtroEstado, filtroCategoria, filtroFechaDesde, filtroFechaHasta }) {
  return (productos || []).filter((p) => {
    const texto = busqueda.toLowerCase();
    const coincideBusqueda =
      p.nombre.toLowerCase().includes(texto) ||
      (p.lote || "").toLowerCase().includes(texto) ||
      (p.codigoBarras || "").toLowerCase().includes(texto) ||
      (p.sucursal?.nombre || "").toLowerCase().includes(texto);

    const coincideCategoria = filtroCategoria ? p.categoria === filtroCategoria : true;

    let coincideEstado = true;
    if (filtroEstado === "vencido")      coincideEstado = estadoVencimiento(p.vencimiento) === "vencido";
    else if (filtroEstado === "por-vencer")  coincideEstado = estadoVencimiento(p.vencimiento) === "por-vencer";
    else if (filtroEstado === "buen-estado") coincideEstado = estadoVencimiento(p.vencimiento) === "buen-estado";
    else if (filtroEstado === "stock-bajo")  coincideEstado = Number(p.stock) > 0 && Number(p.stock) <= 10;
    else if (filtroEstado === "agotado")     coincideEstado = Number(p.stock) <= 0;

    const fechaVenc = new Date(p.vencimiento);
    const coincideFechaDesde = filtroFechaDesde ? fechaVenc >= new Date(filtroFechaDesde) : true;
    const coincideFechaHasta = filtroFechaHasta ? fechaVenc <= new Date(filtroFechaHasta + "T23:59:59") : true;
    return coincideBusqueda && coincideCategoria && coincideEstado && coincideFechaDesde && coincideFechaHasta;
  });
}

export function ordenarProductos(productos, orden) {
  if (!orden) return productos;
  const copia = [...productos];
  const criterios = {
    "alfabetico":      (a, b) => a.nombre.localeCompare(b.nombre),
    "alfabetico-desc": (a, b) => b.nombre.localeCompare(a.nombre),
    "fecha":           (a, b) => new Date(a.vencimiento) - new Date(b.vencimiento),
    "fecha-lejana":    (a, b) => new Date(b.vencimiento) - new Date(a.vencimiento),
    "stock":           (a, b) => Number(a.stock) - Number(b.stock),
    "stock-alto":      (a, b) => Number(b.stock) - Number(a.stock),
    "precio":          (a, b) => Number(a.precio) - Number(b.precio),
    "precio-alto":     (a, b) => Number(b.precio) - Number(a.precio)
  };
  return criterios[orden] ? copia.sort(criterios[orden]) : copia;
}


// Formatea un monto en pesos. Para montos chicos usa el formato normal ($1.234).
// Para montos grandes usa formato compacto para que no desborde: M (millon),
// MMM (mil millones), B (billon = millon de millones, como se usa en Argentina).
export function formatearMonto(valor) {
  const n = Number(valor) || 0;
  const signo = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  const fmt = (x, suf) => {
    const s = x.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 1 });
    return signo + "$" + s + suf;
  };
  if (abs >= 1e12) return fmt(abs / 1e12, " B");
  if (abs >= 1e9) return fmt(abs / 1e9, " MMM");
  if (abs >= 1e6) return fmt(abs / 1e6, " M");
  return signo + "$" + abs.toLocaleString("es-AR");
}

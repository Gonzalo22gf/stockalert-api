import * as XLSX from "xlsx";

// Helper: calcula el ancho optimo de cada columna segun el contenido
function ajustarAnchos(hoja, filas) {
  if (!filas || filas.length === 0) return;
  const columnas = Object.keys(filas[0]);
  const anchos = columnas.map((col) => {
    const maxContenido = Math.max(
      col.length,
      ...filas.map((f) => String(f[col] ?? "").length)
    );
    return { wch: Math.min(maxContenido + 2, 40) };
  });
  hoja["!cols"] = anchos;
}

function estadoVencimiento(vencimiento) {
  const dias = Math.ceil((new Date(vencimiento) - new Date()) / (1000 * 60 * 60 * 24));
  if (dias < 0) return "Vencido";
  if (dias <= 7) return "Por vencer";
  return "En buen estado";
}

export function exportarProductosExcel(productos) {
  if (!productos || productos.length === 0) return;
  const filas = productos.map((p) => ({
    Nombre: p.nombre,
    "Categoria": p.categoria,
    "EAN / Cod. barras": p.codigoBarras || "",
    Lote: p.lote || "",
    Stock: p.stock,
    "Precio ($)": p.precio,
    "Valor total ($)": Number(p.stock || 0) * Number(p.precio || 0),
    Vencimiento: new Date(p.vencimiento).toLocaleDateString("es-AR"),
    Estado: estadoVencimiento(p.vencimiento),
    Zona: p.sucursal?.zona ?? "",
    "N Sucursal": p.sucursal?.numero ?? ""
  }));

  // Fila de totales
  const totalStock = filas.reduce((s, f) => s + Number(f.Stock || 0), 0);
  const totalValor = filas.reduce((s, f) => s + Number(f["Valor total ($)"] || 0), 0);
  filas.push({
    Nombre: "TOTAL",
    "Categoria": "",
    "EAN / Cod. barras": "",
    Lote: "",
    Stock: totalStock,
    "Precio ($)": "",
    "Valor total ($)": totalValor,
    Vencimiento: "",
    Estado: productos.length + " productos",
    Zona: "",
    "N Sucursal": ""
  });

  const hoja = XLSX.utils.json_to_sheet(filas);
  ajustarAnchos(hoja, filas);
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Inventario");
  const fecha = new Date().toLocaleDateString("es-AR").replace(/\//g, "-");
  XLSX.writeFile(libro, "inventario-stockalert-" + fecha + ".xlsx");
}

export function leerArchivoProductos(archivo) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = (e) => {
      try {
        const datos = new Uint8Array(e.target.result);
        const libro = XLSX.read(datos, { type: "array" });
        const primeraHoja = libro.Sheets[libro.SheetNames[0]];
        const filas = XLSX.utils.sheet_to_json(primeraHoja);
        const productos = filas.map((fila) => ({
          nombre: fila.Nombre || fila.nombre || "",
          categoria: fila.Categoria || fila.Categoría || fila.categoria || "",
          precio: Number(fila["Precio ($)"] || fila.Precio || fila.precio || 0),
          stock: Number(fila.Stock || fila.stock || 0),
          lote: String(fila.Lote || fila.lote || ""),
          vencimiento: fila.Vencimiento || fila.vencimiento || "",
          codigoBarras: String(fila["EAN / Cod. barras"] || fila.codigoBarras || "")
        }));
        resolve(productos);
      } catch (error) {
        reject(error);
      }
    };
    lector.onerror = () => reject(new Error("No se pudo leer el archivo"));
    lector.readAsArrayBuffer(archivo);
  });
}

export function descargarBackupSucursal(sucursal, productos) {
  const libro = XLSX.utils.book_new();
  const datosSucursal = [{
    Zona: sucursal.zona,
    "N Sucursal": sucursal.numero,
    Direccion: sucursal.direccion || "",
    "Total productos": productos.length
  }];
  const hojaSucursal = XLSX.utils.json_to_sheet(datosSucursal);
  ajustarAnchos(hojaSucursal, datosSucursal);
  XLSX.utils.book_append_sheet(libro, hojaSucursal, "Sucursal");

  const filasProductos = productos.map((p) => ({
    Nombre: p.nombre,
    Categoria: p.categoria,
    "EAN / Cod. barras": p.codigoBarras || "",
    "Precio ($)": p.precio,
    Stock: p.stock,
    Lote: p.lote || "",
    Vencimiento: new Date(p.vencimiento).toLocaleDateString("es-AR"),
    Zona: p.sucursal?.zona ?? sucursal.zona,
    "N Sucursal": p.sucursal?.numero ?? sucursal.numero
  }));
  const filasExp = filasProductos.length > 0 ? filasProductos : [{ Nombre: "", Categoria: "", "EAN / Cod. barras": "", "Precio ($)": "", Stock: "", Lote: "", Vencimiento: "", Zona: "", "N Sucursal": "" }];
  const hojaProductos = XLSX.utils.json_to_sheet(filasExp);
  ajustarAnchos(hojaProductos, filasExp);
  XLSX.utils.book_append_sheet(libro, hojaProductos, "Productos");

  const fecha = new Date().toLocaleDateString("es-AR").replace(/\//g, "-");
  XLSX.writeFile(libro, "backup-zona" + sucursal.zona + "-suc" + sucursal.numero + "-" + fecha + ".xlsx");
}

export function descargarBackupUsuario(usuario) {
  const libro = XLSX.utils.book_new();
  const datos = [{
    Nombre: usuario.nombre,
    Email: usuario.email,
    Rol: usuario.rol,
    Zona: usuario.sucursal?.zona ?? "",
    "N Sucursal": usuario.sucursal?.numero ?? "",
    Estado: usuario.activo ? "Activo" : "Inactivo"
  }];
  const hoja = XLSX.utils.json_to_sheet(datos);
  ajustarAnchos(hoja, datos);
  XLSX.utils.book_append_sheet(libro, hoja, "Usuario");
  const fecha = new Date().toLocaleDateString("es-AR").replace(/\//g, "-");
  XLSX.writeFile(libro, "backup-usuario-" + usuario.nombre.replace(/[^a-zA-Z0-9]/g, "_") + "-" + fecha + ".xlsx");
}

// Helper exportado para reutilizar en otros componentes
export { ajustarAnchos };

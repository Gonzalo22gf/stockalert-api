import * as XLSX from "xlsx";

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
    Categoría: p.categoria,
    Stock: p.stock,
    Precio: p.precio,
    "Valor total": Number(p.stock || 0) * Number(p.precio || 0),
    Lote: p.lote || "",
    Vencimiento: new Date(p.vencimiento).toLocaleDateString("es-AR"),
    Estado: estadoVencimiento(p.vencimiento),
    Sucursal: p.sucursal?.nombre || ""
  }));

  const hoja = XLSX.utils.json_to_sheet(filas);
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Inventario");

  const fecha = new Date().toLocaleDateString("es-AR").replace(/\//g, "-");
  XLSX.writeFile(libro, `inventario-stockalert-${fecha}.xlsx`);
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
          categoria: fila.Categoría || fila.Categoria || fila.categoria || "",
          precio: Number(fila.Precio || fila.precio || 0),
          stock: Number(fila.Stock || fila.stock || 0),
          lote: String(fila.Lote || fila.lote || ""),
          vencimiento: fila.Vencimiento || fila.vencimiento || ""
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
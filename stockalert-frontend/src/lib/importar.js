import * as XLSX from "xlsx";

// Deriva si el producto vence. Soporta una columna opcional "Vence" (si/no).
// Si esa columna no viene en el Excel, se asume que vence cuando hay fecha.
function derivarVence(fila) {
  const marca = fila.Vence ?? fila.vence;
  if (marca !== undefined && String(marca).trim() !== "") {
    const texto = String(marca).trim().toLowerCase();
    return !["no", "false", "0", "n"].includes(texto);
  }
  return Boolean(fila.Vencimiento || fila.vencimiento);
}

// Lee un archivo Excel/CSV y devuelve la lista de productos mapeada (tolera nombres de columna en varios formatos).
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
          vence: derivarVence(fila),
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

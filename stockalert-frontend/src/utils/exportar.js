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
    Zona: p.sucursal?.zona ?? "",
    Sucursal: p.sucursal?.numero ?? ""
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

export function descargarBackupSucursal(sucursal, productos) {
  const libro = XLSX.utils.book_new();

  // Hoja 1: datos de la sucursal
  const datosSucursal = [{
    Zona: sucursal.zona,
    Sucursal: sucursal.numero,
    Direccion: sucursal.direccion || "",
    Empresa: sucursal.empresa || "",
    "Total productos": productos.length
  }];
  const hojaSucursal = XLSX.utils.json_to_sheet(datosSucursal);
  XLSX.utils.book_append_sheet(libro, hojaSucursal, "Sucursal");

  // Hoja 2: productos (formato compatible para reimportar)
  const filasProductos = productos.map((p) => ({
    Nombre: p.nombre,
    Categoría: p.categoria,
    Precio: p.precio,
    Stock: p.stock,
    Lote: p.lote || "",
    Vencimiento: new Date(p.vencimiento).toLocaleDateString("es-AR"),
    "Código de barras": p.codigoBarras || "",
    Zona: p.sucursal?.zona ?? sucursal.zona,
    Sucursal: p.sucursal?.numero ?? sucursal.numero
  }));
  const hojaProductos = XLSX.utils.json_to_sheet(
    filasProductos.length > 0
      ? filasProductos
      : [{ Nombre: "", Categoría: "", Precio: "", Stock: "", Lote: "", Vencimiento: "", "Código de barras": "", Zona: "", Sucursal: "" }]
  );
  XLSX.utils.book_append_sheet(libro, hojaProductos, "Productos");

  const fecha = new Date().toLocaleDateString("es-AR").replace(/\//g, "-");
  const nombreArchivo = `backup-zona${sucursal.zona}-suc${sucursal.numero}-${fecha}.xlsx`;
  XLSX.writeFile(libro, nombreArchivo);
}

export function descargarBackupUsuario(usuario) {
  const libro = XLSX.utils.book_new();
  const datos = [{
    Nombre: usuario.nombre,
    Email: usuario.email,
    Rol: usuario.rol,
    Zona: usuario.sucursal?.zona ?? "",
    Sucursal: usuario.sucursal?.numero ?? "",
    Estado: usuario.activo ? "Activo" : "Inactivo"
  }];
  const hoja = XLSX.utils.json_to_sheet(datos);
  XLSX.utils.book_append_sheet(libro, hoja, "Usuario");

  const fecha = new Date().toLocaleDateString("es-AR").replace(/\//g, "-");
  const nombreArchivo = `backup-usuario-${usuario.nombre.replace(/[^a-zA-Z0-9]/g, "_")}-${fecha}.xlsx`;
  XLSX.writeFile(libro, nombreArchivo);
}
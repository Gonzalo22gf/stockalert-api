import { useRef } from "react";
import Swal from "sweetalert2";
import { leerArchivoProductos } from "../../lib/exportar";
import { useCrearProducto } from "./useProductos";

export function useImportarProductos({ esAdmin, sucursalSeleccionada }) {
  const inputRef = useRef(null);
  const crearProducto = useCrearProducto();

  function abrirSelector() {
    inputRef.current?.click();
  }

  async function manejarArchivo(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    if (esAdmin && !sucursalSeleccionada) {
      Swal.fire({ icon: "warning", title: "Selecciona una sucursal", text: "Elegi una sucursal antes de importar." });
      e.target.value = "";
      return;
    }

    try {
      const importados = await leerArchivoProductos(archivo);
      const validos = importados.filter((p) => p.nombre && p.categoria && p.vencimiento);

      if (validos.length === 0) {
        Swal.fire({ icon: "warning", title: "Archivo vacio o invalido", text: "Revisa las columnas: Nombre, Categoria, Precio, Stock, Lote, Vencimiento." });
        e.target.value = "";
        return;
      }

      const { isConfirmed } = await Swal.fire({
        title: "Importar " + validos.length + " productos?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Si, importar",
        cancelButtonText: "Cancelar"
      });

      if (!isConfirmed) { e.target.value = ""; return; }

      let exitosos = 0;
      let fallidos = 0;

      for (const p of validos) {
        try {
          await crearProducto.mutateAsync({
            ...p,
            lotes: [{ numero: p.lote, stock: p.stock, vencimiento: p.vencimiento }],
            ...(esAdmin ? { sucursal: sucursalSeleccionada } : {})
          });
          exitosos++;
        } catch {
          fallidos++;
        }
      }

      Swal.fire({
        icon: "success",
        title: "Importacion completada",
        text: exitosos + " productos importados" + (fallidos > 0 ? ", " + fallidos + " fallaron" : "") + "."
      });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    } finally {
      e.target.value = "";
    }
  }

  return { inputRef, abrirSelector, manejarArchivo };
}

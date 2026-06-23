import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useActualizarProducto } from "../hooks/useProductos";

const CATEGORIAS = ["Lácteos", "Bebidas", "Almacén", "Limpieza", "Congelados"];

function fechaParaInput(vencimiento) {
  if (!vencimiento) return "";
  return new Date(vencimiento).toISOString().split("T")[0];
}

export default function ModalEditarProducto({ producto, onCerrar }) {
  const actualizarProducto = useActualizarProducto();

  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [precio, setPrecio] = useState("");
  const [lote, setLote] = useState("");
  const [stock, setStock] = useState("");
  const [vencimiento, setVencimiento] = useState("");

  useEffect(() => {
    if (producto) {
      setNombre(producto.nombre || "");
      setCategoria(producto.categoria || "");
      setPrecio(producto.precio ?? "");
      setLote(producto.lote || "");
      setStock(producto.stock ?? "");
      setVencimiento(fechaParaInput(producto.vencimiento));
    }
  }, [producto]);

  if (!producto) return null;

  async function manejarGuardar(e) {
    e.preventDefault();

    if (!nombre || !categoria || precio === "" || stock === "" || !vencimiento) {
      Swal.fire({ icon: "warning", title: "Datos incompletos", text: "Completá todos los campos." });
      return;
    }

    const datos = {
      nombre,
      categoria,
      precio: Number(precio),
      lote,
      stock: Number(stock),
      vencimiento,
      lotes: [{ numero: lote, stock: Number(stock), vencimiento }]
    };

    try {
      await actualizarProducto.mutateAsync({ id: producto._id, datos });
      Swal.fire({ icon: "success", title: "Producto actualizado", timer: 1400, showConfirmButton: false });
      onCerrar();
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    }
  }

  const inputClase =
    "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onCerrar}>
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-base font-bold text-white">Editar producto</h2>

        <form onSubmit={manejarGuardar} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Nombre</label>
            <input className={inputClase} value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Categoría</label>
              <select className={inputClase} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                <option value="">Categoría</option>
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Precio $</label>
              <input className={inputClase} type="number" value={precio} onChange={(e) => setPrecio(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">N° de lote</label>
              <input className={inputClase} value={lote} onChange={(e) => setLote(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Stock</label>
              <input className={inputClase} type="number" value={stock} onChange={(e) => setStock(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400">Vencimiento</label>
            <input className={inputClase} type="date" value={vencimiento} onChange={(e) => setVencimiento(e.target.value)} />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={actualizarProducto.isPending}
              className="flex-1 rounded-lg bg-brand py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {actualizarProducto.isPending ? "Guardando..." : "Guardar cambios"}
            </button>
            <button
              type="button"
              onClick={onCerrar}
              className="flex-1 rounded-lg border border-slate-700 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
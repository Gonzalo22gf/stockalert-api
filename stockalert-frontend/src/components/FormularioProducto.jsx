import { useState } from "react";
import Swal from "sweetalert2";
import { useCrearProducto } from "../hooks/useProductos";
import { useSucursales } from "../hooks/useSucursales";
import EscanerEAN from "./EscanerEAN";

const CATEGORIAS = ["Lácteos", "Bebidas", "Almacén", "Limpieza", "Congelados"];

export default function FormularioProducto({ esAdmin }) {
  const crearProducto = useCrearProducto();
  const { data: sucursales } = useSucursales(esAdmin);

  const [ean, setEan] = useState("");
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [precio, setPrecio] = useState("");
  const [lote, setLote] = useState("");
  const [stock, setStock] = useState("");
  const [vencimiento, setVencimiento] = useState("");
  const [sucursalId, setSucursalId] = useState("");
  const [escanerAbierto, setEscanerAbierto] = useState(false);

  function limpiarForm() {
    setEan("");
    setNombre("");
    setCategoria("");
    setPrecio("");
    setLote("");
    setStock("");
    setVencimiento("");
    setSucursalId("");
  }

  function manejarDetectado(codigo) {
    setEan(codigo);
    setEscanerAbierto(false);
    Swal.fire({ icon: "success", title: "Código detectado", text: codigo, timer: 1400, showConfirmButton: false });
  }

  async function manejarSubmit(e) {
    e.preventDefault();

    if (!nombre || !categoria || !precio || !stock || !vencimiento) {
      Swal.fire({ icon: "warning", title: "Datos incompletos", text: "Completá todos los campos correctamente." });
      return;
    }

    if (esAdmin && !sucursalId) {
      Swal.fire({ icon: "warning", title: "Seleccioná una sucursal", text: "Elegí a qué sucursal pertenece el producto." });
      return;
    }

    const nuevoProducto = {
      nombre,
      categoria,
      precio: Number(precio),
      lote,
      stock: Number(stock),
      vencimiento,
      codigoBarras: ean,
      lotes: [{ numero: lote, stock: Number(stock), vencimiento }],
      ...(esAdmin ? { sucursal: sucursalId } : {})
    };

    try {
      await crearProducto.mutateAsync(nuevoProducto);
      limpiarForm();
      Swal.fire({ icon: "success", title: "Producto agregado", timer: 1500, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    }
  }

  const inputClase =
    "rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand focus:outline-none";

  return (
    <form onSubmit={manejarSubmit} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <h2 className="mb-3 text-sm font-semibold text-white">Agregar producto</h2>

      <div className="mb-3 flex gap-2">
        <input
          className={`flex-1 ${inputClase}`}
          placeholder="EAN / Código de barras"
          value={ean}
          onChange={(e) => setEan(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setEscanerAbierto(true)}
          className="shrink-0 rounded-lg border border-green-600/40 bg-green-600/10 px-4 py-2 text-sm font-semibold text-green-400 hover:bg-green-600/20"
        >
          📷 Escanear EAN
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <input className={inputClase} placeholder="Nombre del producto" value={nombre} onChange={(e) => setNombre(e.target.value)} />

        <select className={inputClase} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          <option value="">Categoría</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <input className={inputClase} type="number" placeholder="Precio $" value={precio} onChange={(e) => setPrecio(e.target.value)} />
        <input className={inputClase} placeholder="N° de lote" value={lote} onChange={(e) => setLote(e.target.value)} />
        <input className={inputClase} type="number" placeholder="Stock" value={stock} onChange={(e) => setStock(e.target.value)} />
        <input className={inputClase} type="date" value={vencimiento} onChange={(e) => setVencimiento(e.target.value)} />

        {esAdmin && (
          <select className={`sm:col-span-2 lg:col-span-3 ${inputClase}`} value={sucursalId} onChange={(e) => setSucursalId(e.target.value)}>
            <option value="">Seleccioná la sucursal del producto</option>
            {(sucursales || []).map((s) => (
              <option key={s._id} value={s._id}>
                {s.nombre}
              </option>
            ))}
          </select>
        )}
      </div>

      <button
        type="submit"
        disabled={crearProducto.isPending}
        className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        {crearProducto.isPending ? "Guardando..." : "Guardar producto"}
      </button>

      {escanerAbierto && <EscanerEAN onDetectado={manejarDetectado} onCerrar={() => setEscanerAbierto(false)} />}
    </form>
  );
}
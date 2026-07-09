import { useState } from "react";
import Swal from "sweetalert2";
import { useCrearProducto } from "../hooks/useProductos";
import { useSucursales } from "../hooks/useSucursales";
import EscanerEAN from "./EscanerEAN";
import Boton from "./ui/Boton";
import { Input, Select } from "./ui/Input";

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

  return (
    <form onSubmit={manejarSubmit} className="animate-rise rounded-xl border border-slate-800 bg-slate-900 p-4">
      <h2 className="mb-3 text-sm font-semibold text-white">Agregar producto</h2>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <Input
          className="flex-1"
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
        <Input placeholder="Nombre del producto" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <Select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          <option value="">Categoría</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <Input type="number" placeholder="Precio $" value={precio} onChange={(e) => setPrecio(e.target.value)} />
        <Input placeholder="N° de lote" value={lote} onChange={(e) => setLote(e.target.value)} />
        <Input type="number" placeholder="Stock" value={stock} onChange={(e) => setStock(e.target.value)} />
        <Input type="date" value={vencimiento} onChange={(e) => setVencimiento(e.target.value)} />
        {esAdmin && (
          <Select className="sm:col-span-2 lg:col-span-3" value={sucursalId} onChange={(e) => setSucursalId(e.target.value)}>
            <option value="">Seleccioná la sucursal del producto</option>
            {(sucursales || []).map((s) => (
              <option key={s._id} value={s._id}>{s.nombre}</option>
            ))}
          </Select>
        )}
      </div>
      <Boton type="submit" disabled={crearProducto.isPending} className="mt-4">
        {crearProducto.isPending ? "Guardando..." : "Guardar producto"}
      </Boton>
      {escanerAbierto && <EscanerEAN onDetectado={manejarDetectado} onCerrar={() => setEscanerAbierto(false)} />}
    </form>
  );
}

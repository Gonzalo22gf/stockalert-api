import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuthStore } from "../store/authStore";
import { useProductos, useEliminarProducto, useCrearProducto } from "../hooks/useProductos";
import { useSucursales } from "../hooks/useSucursales";
import FormularioProducto from "../components/FormularioProducto";
import ProductoCard from "../components/ProductoCard";
import ModalEditarProducto from "../components/ModalEditarProducto";
import { exportarProductosExcel, leerArchivoProductos } from "../utils/exportar";

function estadoVencimiento(vencimiento) {
  const dias = Math.ceil((new Date(vencimiento) - new Date()) / (1000 * 60 * 60 * 24));
  if (dias < 0) return "vencido";
  if (dias <= 7) return "por-vencer";
  return "buen-estado";
}

export default function ProductosPage() {
  const usuario = useAuthStore((s) => s.usuario);
  const esAdmin = usuario?.rol === "admin";

  const [searchParams] = useSearchParams();

  const [sucursalSeleccionada, setSucursalSeleccionada] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [orden, setOrden] = useState("");
  const [productoEditando, setProductoEditando] = useState(null);

  useEffect(() => {
    const sucursalUrl = searchParams.get("sucursal");
    if (sucursalUrl && esAdmin) {
      setSucursalSeleccionada(sucursalUrl);
    }
  }, [searchParams, esAdmin]);

  const { data: sucursales } = useSucursales(esAdmin);
  const { data: productos, isLoading, isError } = useProductos(esAdmin ? sucursalSeleccionada : undefined);
  const eliminarProducto = useEliminarProducto();
  const crearProducto = useCrearProducto();
  const inputArchivoRef = useRef(null);

  async function manejarEliminar(producto) {
    const resultado = await Swal.fire({
      title: "¿Eliminar producto?",
      text: `"${producto.nombre}" se va a eliminar permanentemente.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });
    if (!resultado.isConfirmed) return;

    try {
      await eliminarProducto.mutateAsync(producto._id);
      Swal.fire({ icon: "success", title: "Eliminado", timer: 1300, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    }
  }

  function manejarEditar(producto) {
    setProductoEditando(producto);
  }

  async function manejarImportar(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    if (esAdmin && !sucursalSeleccionada) {
      Swal.fire({ icon: "warning", title: "Seleccioná una sucursal", text: "Elegí una sucursal antes de importar." });
      e.target.value = "";
      return;
    }

    try {
      const productosImportados = await leerArchivoProductos(archivo);
      const validos = productosImportados.filter((p) => p.nombre && p.categoria && p.vencimiento);

      if (validos.length === 0) {
        Swal.fire({ icon: "warning", title: "Archivo vacío o inválido", text: "Revisá las columnas: Nombre, Categoría, Precio, Stock, Lote, Vencimiento." });
        e.target.value = "";
        return;
      }

      const confirmacion = await Swal.fire({
        title: `¿Importar ${validos.length} productos?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sí, importar",
        cancelButtonText: "Cancelar"
      });
      if (!confirmacion.isConfirmed) {
        e.target.value = "";
        return;
      }

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
        title: "Importación completada",
        text: `${exitosos} productos importados${fallidos > 0 ? `, ${fallidos} fallaron` : ""}.`
      });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    } finally {
      e.target.value = "";
    }
  }

  // Filtrado
  let productosFiltrados = (productos || []).filter((p) => {
    const texto = busqueda.toLowerCase();
    const coincideBusqueda =
      p.nombre.toLowerCase().includes(texto) ||
      (p.lote || "").toLowerCase().includes(texto) ||
      (p.sucursal?.nombre || "").toLowerCase().includes(texto);

    let coincideEstado = true;
    if (filtroEstado === "vencido") coincideEstado = estadoVencimiento(p.vencimiento) === "vencido";
    else if (filtroEstado === "por-vencer") coincideEstado = estadoVencimiento(p.vencimiento) === "por-vencer";
    else if (filtroEstado === "buen-estado") coincideEstado = estadoVencimiento(p.vencimiento) === "buen-estado";
    else if (filtroEstado === "stock-bajo") coincideEstado = Number(p.stock) > 0 && Number(p.stock) <= 10;
    else if (filtroEstado === "agotado") coincideEstado = Number(p.stock) <= 0;

    return coincideBusqueda && coincideEstado;
  });

  // Ordenamiento
  if (orden === "alfabetico") {
    productosFiltrados = [...productosFiltrados].sort((a, b) => a.nombre.localeCompare(b.nombre));
  } else if (orden === "fecha") {
    productosFiltrados = [...productosFiltrados].sort((a, b) => new Date(a.vencimiento) - new Date(b.vencimiento));
  } else if (orden === "stock") {
    productosFiltrados = [...productosFiltrados].sort((a, b) => Number(a.stock) - Number(b.stock));
  }

  const inputClase =
    "rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand focus:outline-none";

  return (
    <div className="space-y-6">
      {esAdmin && (
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-400">🏪 Sucursal</label>
          <select value={sucursalSeleccionada} onChange={(e) => setSucursalSeleccionada(e.target.value)} className={inputClase}>
            <option value="">Todas las sucursales</option>
            {(sucursales || []).map((s) => (
              <option key={s._id} value={s._id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      <FormularioProducto esAdmin={esAdmin} />

      {/* Barra de filtros */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <input
            type="text"
            placeholder="🔍 Buscar por nombre, lote o sucursal..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className={`md:col-span-5 ${inputClase}`}
          />
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className={`md:col-span-3 ${inputClase}`}>
            <option value="">Todos los estados</option>
            <option value="buen-estado">En buen estado</option>
            <option value="por-vencer">Por vencer</option>
            <option value="vencido">Vencido</option>
            <option value="stock-bajo">Stock bajo</option>
            <option value="agotado">Agotado</option>
          </select>
          <select value={orden} onChange={(e) => setOrden(e.target.value)} className={`md:col-span-2 ${inputClase}`}>
            <option value="">Ordenar por...</option>
            <option value="alfabetico">Nombre (A-Z)</option>
            <option value="fecha">Vencimiento</option>
            <option value="stock">Stock (menor)</option>
          </select>
          <div className="flex gap-2 md:col-span-2">
            <button
              onClick={() => exportarProductosExcel(productosFiltrados)}
              disabled={!productosFiltrados || productosFiltrados.length === 0}
              className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              ↓ Excel
            </button>
            <button
              onClick={() => inputArchivoRef.current?.click()}
              className="flex-1 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              ↑ Importar
            </button>
            <input ref={inputArchivoRef} type="file" accept=".csv,.xlsx,.xls" onChange={manejarImportar} className="hidden" />
          </div>
        </div>
      </div>

      {isLoading && <p className="text-sm text-slate-400">Cargando productos...</p>}
      {isError && <p className="text-sm text-red-400">No se pudieron cargar los productos.</p>}

      {!isLoading && !isError && (
        <>
          <p className="text-xs text-slate-500">Mostrando {productosFiltrados.length} de {productos?.length || 0} productos</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {productosFiltrados.map((producto) => (
              <ProductoCard key={producto._id} producto={producto} esAdmin={esAdmin} onEditar={manejarEditar} onEliminar={manejarEliminar} />
            ))}
          </div>
          {productosFiltrados.length === 0 && <p className="text-sm text-slate-500">No hay productos para mostrar.</p>}
        </>
      )}

      {productoEditando && <ModalEditarProducto producto={productoEditando} onCerrar={() => setProductoEditando(null)} />}
    </div>
  );
}
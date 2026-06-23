import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useMovimientos } from "../hooks/useMovimientos";
import { useSucursales } from "../hooks/useSucursales";
import MovimientoCard from "../components/MovimientoCard";

const FILTROS_TIPO = [
  { valor: "", label: "Todas las acciones" },
  { valor: "creacion", label: "Creados" },
  { valor: "edicion", label: "Editados" },
  { valor: "eliminacion", label: "Eliminados" }
];

export default function MovimientosPage() {
  const usuario = useAuthStore((s) => s.usuario);
  const esAdmin = usuario?.rol === "admin";

  const [sucursalSeleccionada, setSucursalSeleccionada] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const { data: sucursales } = useSucursales(esAdmin);
  const { data: movimientos, isLoading, isError } = useMovimientos(esAdmin ? sucursalSeleccionada : undefined);

  if (!esAdmin) {
    return <Navigate to="/productos" replace />;
  }

  const movimientosFiltrados = (movimientos || []).filter((m) => {
    const coincideTipo = tipoFiltro ? m.tipo === tipoFiltro : true;
    const coincideBusqueda = (m.nombreProducto || "").toLowerCase().includes(busqueda.toLowerCase());
    return coincideTipo && coincideBusqueda;
  });

  const inputClase =
    "rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand focus:outline-none";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <select value={sucursalSeleccionada} onChange={(e) => setSucursalSeleccionada(e.target.value)} className={inputClase}>
          <option value="">Todas las sucursales</option>
          {(sucursales || []).map((s) => (
            <option key={s._id} value={s._id}>
              {s.nombre}
            </option>
          ))}
        </select>

        <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)} className={inputClase}>
          {FILTROS_TIPO.map((f) => (
            <option key={f.valor} value={f.valor}>
              {f.label}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Buscar por producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className={`flex-1 ${inputClase}`}
        />
      </div>

      {isLoading && <p className="text-sm text-slate-400">Cargando movimientos...</p>}
      {isError && <p className="text-sm text-red-400">No se pudieron cargar los movimientos.</p>}

      {!isLoading && !isError && (
        <>
          <p className="text-xs text-slate-500">Mostrando {movimientosFiltrados.length} de {movimientos?.length || 0} movimientos</p>
          <div className="space-y-3">
            {movimientosFiltrados.map((m) => (
              <MovimientoCard key={m._id} movimiento={m} />
            ))}
          </div>
          {movimientosFiltrados.length === 0 && <p className="text-sm text-slate-500">No hay movimientos para mostrar.</p>}
        </>
      )}
    </div>
  );
}
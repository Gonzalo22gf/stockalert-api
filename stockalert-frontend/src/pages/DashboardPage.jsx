import PanelRiesgo from "../components/PanelRiesgo";
import { useProductos } from "../hooks/useProductos";
import GraficosDashboard from "../components/GraficosDashboard";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useResumenSucursales } from "../hooks/useSucursales";
import { useAuthStore } from "../store/authStore";
import KpiCard from "../components/KpiCard";

export default function DashboardPage() {
  const usuario = useAuthStore((s) => s.usuario);
  const esAdmin = usuario?.rol === "admin";

  const { data: resumen, isLoading, isError } = useResumenSucursales(esAdmin);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState("");
  const { data: productos } = useProductos(esAdmin ? sucursalSeleccionada : undefined);

  if (!esAdmin) {
    return <Navigate to="/productos" replace />;
  }

  if (isLoading) {
    return <p className="text-sm text-slate-400">Cargando dashboard...</p>;
  }

  if (isError || !resumen) {
    return <p className="text-sm text-red-400">No se pudo cargar el dashboard.</p>;
  }

  let totales;
  if (sucursalSeleccionada) {
    const item = resumen.find((r) => r.sucursal._id === sucursalSeleccionada);
    totales = item
      ? {
          nombre: item.sucursal.nombre,
          totalProductos: item.totalProductos,
          porVencer: item.porVencer,
          vencidos: item.vencidos,
          stockCritico: item.stockCritico,
          valorInventario: item.valorInventario
        }
      : null;
  } else {
    totales = {
      nombre: "Todas las sucursales",
      totalProductos: resumen.reduce((t, r) => t + r.totalProductos, 0),
      porVencer: resumen.reduce((t, r) => t + r.porVencer, 0),
      vencidos: resumen.reduce((t, r) => t + r.vencidos, 0),
      stockCritico: resumen.reduce((t, r) => t + r.stockCritico, 0),
      valorInventario: resumen.reduce((t, r) => t + r.valorInventario, 0)
    };
  }

  const formatoMoneda = (v) => v.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <label className="text-sm text-slate-400">🏪 Ver sucursal</label>
        <select
          value={sucursalSeleccionada}
          onChange={(e) => setSucursalSeleccionada(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-white focus:border-brand focus:outline-none"
        >
          <option value="">Todas las sucursales</option>
          {resumen.map((r) => (
            <option key={r.sucursal._id} value={r.sucursal._id}>
              {r.sucursal.nombre}
            </option>
          ))}
        </select>
      </div>

      {totales && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-300">🏪 {totales.nombre}</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            <KpiCard etiqueta="Productos" valor={totales.totalProductos} color="blue" />
            <KpiCard etiqueta="Por vencer" valor={totales.porVencer} color="yellow" />
            <KpiCard etiqueta="Vencidos" valor={totales.vencidos} color="red" />
            <KpiCard etiqueta="Stock crítico" valor={totales.stockCritico} color="purple" />
            <KpiCard etiqueta="Valor inventario" valor={formatoMoneda(totales.valorInventario)} color="green" />
        </div>
        </div>
      )}

      <PanelRiesgo productos={productos} />

      <GraficosDashboard productos={productos} />
    </div>
  );
}
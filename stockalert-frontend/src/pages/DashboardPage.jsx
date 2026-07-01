import { SkeletonKpis } from "../components/Skeleton";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useResumenSucursales } from "../hooks/useSucursales";
import { useProductos } from "../hooks/useProductos";
import { useAuthStore } from "../store/authStore";
import KpiCard from "../components/KpiCard";
import PanelRiesgo from "../components/PanelRiesgo";
import GraficosDashboard from "../components/GraficosDashboard";

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
    return (
      <div className="space-y-6">
        <SkeletonKpis />
      </div>
    );
  }

  if (isError || !resumen) {
    return <p className="text-sm text-red-400">No se pudo cargar el dashboard.</p>;
  }

  const cantidadTiendas = resumen.length;

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

  const verTodas = !sucursalSeleccionada;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <label className="text-sm text-slate-400">🏪 Ver sucursal</label>
        <select
          value={sucursalSeleccionada}
          onChange={(e) => setSucursalSeleccionada(e.target.value)}
          className="rounded-lg border border-border bg-panel px-3 py-1.5 text-sm text-white transition-colors focus:border-brand focus:outline-none"
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
          <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-6">
            {verTodas && (
              <KpiCard etiqueta="Tiendas" valor={cantidadTiendas} color="cyan" descripcion="sucursales activas" delay={0.02} />
            )}
            <KpiCard etiqueta="Productos" valor={totales.totalProductos} color="indigo" descripcion="en inventario" delay={0.04} />
            <KpiCard etiqueta="Por vencer" valor={totales.porVencer} color="amber" descripcion="próximos 7 días" delay={0.08} />
            <KpiCard etiqueta="Vencidos" valor={totales.vencidos} color="red" descripcion="requieren acción" delay={0.12} />
            <KpiCard etiqueta="Stock crítico" valor={totales.stockCritico} color="purple" descripcion="bajo umbral" delay={0.16} />
            <KpiCard etiqueta="Valor inventario" valor={totales.valorInventario} prefijo="$ " color="emerald" descripcion="total en stock" delay={0.2} />
          </div>
        </div>
      )}

      <PanelRiesgo productos={productos} />

      <GraficosDashboard productos={productos} resumenSucursales={verTodas ? resumen : null} />
    </div>
  );
}

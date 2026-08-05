import { useState } from "react";
import { useResumenSucursales } from "../sucursales/useSucursales";
import { useProductos } from "../productos/useProductos";
import { useAuthStore } from "../auth/authStore";
import { SkeletonKpis } from "../../components/Skeleton";
import KpiCard from "./KpiCard";
import PanelRiesgo from "./PanelRiesgo";
import GraficosDashboard from "./GraficosDashboard";

export default function DashboardPage() {
  const usuario = useAuthStore((s) => s.usuario);
  const esAdmin = usuario?.rol === "admin";
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState("");
  const { data: resumen, isLoading, isError } = useResumenSucursales(true);
  const sucursalFiltro = esAdmin ? sucursalSeleccionada : usuario?.sucursal?._id || usuario?.sucursal;
  const { data: productos } = useProductos(sucursalFiltro || undefined);

  if (isLoading) return <div className="space-y-6"><SkeletonKpis /></div>;
  if (isError || !resumen) return <p className="text-sm text-red-400">No se pudo cargar el dashboard.</p>;

  // Admin: calcula totales segun filtro. Jefe: usa solo su sucursal
  let totales;
  if (esAdmin) {
    if (sucursalSeleccionada) {
      const item = resumen.find((r) => r.sucursal._id === sucursalSeleccionada);
      totales = item ? {
        nombre: item.sucursal.nombre,
        totalProductos: item.totalProductos,
        porVencer: item.porVencer,
        vencidos: item.vencidos,
        stockCritico: item.stockCritico,
        valorInventario: item.valorInventario
      } : null;
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
  } else {
    const sucursalId = usuario?.sucursal?._id || usuario?.sucursal;
    const item = resumen.find((r) => String(r.sucursal._id) === String(sucursalId));
    totales = item ? {
      nombre: item.sucursal.nombre || "Mi sucursal",
      totalProductos: item.totalProductos,
      porVencer: item.porVencer,
      vencidos: item.vencidos,
      stockCritico: item.stockCritico,
      valorInventario: item.valorInventario
    } : null;
  }

  const verTodas = esAdmin && !sucursalSeleccionada;
  const cantidadTiendas = resumen.length;

  return (
    <div className="space-y-6">
      {/* Selector de sucursal — solo para admins */}
      {esAdmin && (
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-400">Ver sucursal</label>
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
      )}

      {totales && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-300">{totales.nombre}</h2>
          <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-6">
            {verTodas && (
              <KpiCard etiqueta="Tiendas" valor={cantidadTiendas} color="cyan" descripcion="sucursales activas" delay={0.02} />
            )}
            <KpiCard etiqueta="Productos" valor={totales.totalProductos} color="indigo" descripcion="en inventario" delay={0.04} />
            <KpiCard etiqueta="Por vencer" valor={totales.porVencer} color="amber" descripcion="proximos 7 dias" delay={0.08} />
            <KpiCard etiqueta="Vencidos" valor={totales.vencidos} color="red" descripcion="requieren accion" delay={0.12} />
            <KpiCard etiqueta="Stock critico" valor={totales.stockCritico} color="purple" descripcion="bajo umbral" delay={0.16} />
            <KpiCard etiqueta="Valor inventario" valor={totales.valorInventario} prefijo="$ " color="emerald" descripcion="total en stock" delay={0.2} />
          </div>
        </div>
      )}

      <PanelRiesgo productos={productos} />
      <GraficosDashboard productos={productos} resumenSucursales={verTodas ? resumen : null} />
    </div>
  );
}

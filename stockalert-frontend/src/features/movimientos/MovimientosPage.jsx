import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../auth/authStore";
import { useMovimientos } from "./useMovimientos";
import { useSucursales } from "../sucursales/useSucursales";
import MovimientoCard from "./MovimientoCard";
import EmptyState from "../../components/EmptyState";
import { SkeletonTabla } from "../../components/Skeleton";

export default function MovimientosPage() {
  const { t } = useTranslation();
  const usuario = useAuthStore((s) => s.usuario);
  const esAdmin = usuario?.rol === "admin";
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const { data: sucursales } = useSucursales(esAdmin);
  const { data: movimientos, isLoading, isError } = useMovimientos(esAdmin ? sucursalSeleccionada : undefined);

  if (!esAdmin) return <Navigate to="/productos" replace />;

  const FILTROS_TIPO = [
    { valor: "", label: t("movimientos.todas") },
    { valor: "CREAR", label: t("movimientos.creados") },
    { valor: "EDITAR", label: t("movimientos.editados") },
    { valor: "ELIMINAR", label: t("movimientos.eliminados") }
  ];

  const movimientosFiltrados = (movimientos || []).filter((m) => {
    const coincideTipo = tipoFiltro ? m.accion === tipoFiltro : true;
    const coincideBusqueda = (m.nombreProducto || "").toLowerCase().includes(busqueda.toLowerCase());
    let coincideFecha = true;
    const fechaMov = new Date(m.createdAt);
    if (fechaDesde) { const d = new Date(fechaDesde); d.setHours(0,0,0,0); if (fechaMov < d) coincideFecha = false; }
    if (fechaHasta) { const h = new Date(fechaHasta); h.setHours(23,59,59,999); if (fechaMov > h) coincideFecha = false; }
    return coincideTipo && coincideBusqueda && coincideFecha;
  });

  function limpiarFiltros() { setTipoFiltro(""); setBusqueda(""); setFechaDesde(""); setFechaHasta(""); }

  const inputClase = "rounded-lg border border-border bg-panel px-3 py-2 text-sm text-white placeholder:text-slate-500 transition-colors focus:border-brand focus:outline-none";

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border-soft bg-panel p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select value={sucursalSeleccionada} onChange={(e) => setSucursalSeleccionada(e.target.value)} className={inputClase}>
            <option value="">{t("movimientos.todasSucursales")}</option>
            {(sucursales || []).map((s) => (<option key={s._id} value={s._id}>{s.nombre}</option>))}
          </select>
          <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)} className={inputClase}>
            {FILTROS_TIPO.map((f) => (<option key={f.valor} value={f.valor}>{f.label}</option>))}
          </select>
          <input type="text" placeholder={"🔍 " + t("movimientos.buscar")} value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className={"flex-1 " + inputClase} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">{t("movimientos.desde")}</label>
            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className={inputClase} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">{t("movimientos.hasta")}</label>
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className={inputClase} />
          </div>
          {(tipoFiltro || busqueda || fechaDesde || fechaHasta) && (
            <button onClick={limpiarFiltros} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-slate-400 transition-colors hover:bg-panel-hover hover:text-white">
              {t("movimientos.limpiar")}
            </button>
          )}
        </div>
      </div>

      {isLoading && <SkeletonTabla filas={6} />}
      {isError && <p className="text-sm text-red-400">{t("movimientos.error")}</p>}
      {!isLoading && !isError && (
        <>
          <p className="text-xs text-slate-500">{t("movimientos.mostrando")} {movimientosFiltrados.length} {t("movimientos.de")} {movimientos?.length || 0}</p>
          <div className="space-y-3">
            {movimientosFiltrados.map((m) => (<MovimientoCard key={m._id} movimiento={m} />))}
          </div>
          {movimientosFiltrados.length === 0 && <EmptyState icono="📋" titulo={t("movimientos.sinMovimientos")} descripcion="" />}
        </>
      )}
    </div>
  );
}

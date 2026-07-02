import { useState } from "react";
import { Navigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { useAuthStore } from "../store/authStore";
import { useSnapshots } from "../hooks/useSnapshots";
import { SkeletonTabla } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import Boton from "../components/ui/Boton";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

const PERIODOS = {
  diario: { label: "Diario", dias: 14, titulo: "Últimos 14 días" },
  semanal: { label: "Semanal", dias: 84, titulo: "Últimas 12 semanas" },
  mensual: { label: "Mensual", dias: 365, titulo: "Últimos 12 meses" },
  anual: { label: "Anual", dias: 1825, titulo: "Últimos 5 años" }
};

const CATS = ["Lácteos", "Bebidas", "Almacén", "Limpieza", "Congelados", "Otros"];

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtMoneda(v) {
  return "$ " + Number(v || 0).toLocaleString("es-AR");
}

function cat(obj, nombre) {
  return (obj && obj.categorias && obj.categorias[nombre]) || 0;
}

export default function ReportesPage() {
  const usuario = useAuthStore((s) => s.usuario);
  const esAdmin = usuario?.rol === "admin";

  const [periodo, setPeriodo] = useState("diario");

  const dias = PERIODOS[periodo].dias;
  const hasta = new Date();
  const desde = new Date();
  desde.setDate(desde.getDate() - dias);
  const desdeStr = desde.toISOString().slice(0, 10);
  const hastaStr = hasta.toISOString().slice(0, 10);

  const { data: snapshots, isLoading, isError } = useSnapshots(desdeStr, hastaStr, esAdmin);

  if (!esAdmin) {
    return <Navigate to="/productos" replace />;
  }

  const hayDatos = snapshots && snapshots.length > 0;

  const datosGrafico = {
    labels: (snapshots || []).map((s) => formatearFecha(s.fecha)),
    datasets: [
      {
        label: "Vencidos",
        data: (snapshots || []).map((s) => s.totales.vencidos),
        borderColor: "#ef4444",
        backgroundColor: "#ef444422",
        tension: 0.3,
        fill: true
      },
      {
        label: "Por vencer",
        data: (snapshots || []).map((s) => s.totales.porVencer),
        borderColor: "#f59e0b",
        backgroundColor: "#f59e0b22",
        tension: 0.3,
        fill: true
      },
      {
        label: "Stock crítico",
        data: (snapshots || []).map((s) => s.totales.stockCritico),
        borderColor: "#a855f7",
        backgroundColor: "#a855f722",
        tension: 0.3,
        fill: true
      }
    ]
  };

  const opcionesGrafico = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: "#cbd1e0", font: { size: 12, family: "Inter" }, padding: 14, usePointStyle: true, pointStyle: "circle" }
      },
      tooltip: {
        backgroundColor: "#1a1d26",
        titleColor: "#f1f3f8",
        bodyColor: "#cbd1e0",
        borderColor: "#2a2e3a",
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8
      }
    },
    scales: {
      x: { ticks: { color: "#6b7280", font: { size: 10 } }, grid: { color: "#1c1f29" }, border: { display: false } },
      y: { ticks: { color: "#6b7280", font: { size: 10 } }, grid: { color: "#1c1f29" }, border: { display: false }, beginAtZero: true }
    }
  };

  function descargarExcel() {
    if (!hayDatos) return;
    const libro = XLSX.utils.book_new();

    const filasResumen = snapshots.map((s) => {
      const fila = {
        Fecha: formatearFecha(s.fecha),
        Tiendas: s.totales.tiendas,
        "Total productos": s.totales.totalProductos,
        Vencidos: s.totales.vencidos,
        "Por vencer": s.totales.porVencer,
        "Stock crítico": s.totales.stockCritico,
        Agotados: s.totales.agotados,
        "Valor inventario": s.totales.valorInventario
      };
      CATS.forEach((c) => { fila[c] = cat(s.totales, c); });
      return fila;
    });
    const hojaResumen = XLSX.utils.json_to_sheet(filasResumen);
    XLSX.utils.book_append_sheet(libro, hojaResumen, "Resumen general");

    const ultimoSnapshot = snapshots[snapshots.length - 1];
    (ultimoSnapshot.sucursales || []).forEach((suc) => {
      const filasTienda = snapshots.map((s) => {
        const dt = (s.sucursales || []).find((x) => String(x.sucursalId) === String(suc.sucursalId)) || {};
        const fila = {
          Fecha: formatearFecha(s.fecha),
          "Total productos": dt.totalProductos ?? 0,
          Vencidos: dt.vencidos ?? 0,
          "Por vencer": dt.porVencer ?? 0,
          "Stock crítico": dt.stockCritico ?? 0,
          Agotados: dt.agotados ?? 0,
          "Valor inventario": dt.valorInventario ?? 0
        };
        CATS.forEach((c) => { fila[c] = cat(dt, c); });
        return fila;
      });
      const hoja = XLSX.utils.json_to_sheet(filasTienda);
      const nombreHoja = ("T" + suc.numero + " " + suc.nombre).slice(0, 31).replace(/[:\\/?*[\]]/g, "");
      XLSX.utils.book_append_sheet(libro, hoja, nombreHoja);
    });

    const fecha = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(libro, "reporte_" + periodo + "_" + fecha + ".xlsx");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {Object.entries(PERIODOS).map(([clave, cfg]) => (
            <button
              key={clave}
              onClick={() => setPeriodo(clave)}
              className={
                "rounded-lg px-4 py-2 text-sm font-semibold transition-colors " +
                (periodo === clave
                  ? "bg-brand text-white"
                  : "border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700")
              }
            >
              {cfg.label}
            </button>
          ))}
        </div>
        <Boton variante="success" onClick={descargarExcel} disabled={!hayDatos}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Descargar Excel
        </Boton>
      </div>

      <p className="text-xs text-slate-500">{PERIODOS[periodo].titulo} · {hayDatos ? snapshots.length : 0} registros</p>

      {isLoading && <SkeletonTabla filas={5} />}
      {isError && <p className="text-sm text-red-400">No se pudo cargar el histórico.</p>}

      {!isLoading && !isError && !hayDatos && (
        <EmptyState
          icono="📈"
          titulo="Todavía no hay historial en este período"
          descripcion="El sistema guarda una foto de las tiendas cada día. En unos días vas a ver acá la evolución completa."
        />
      )}

      {!isLoading && !isError && hayDatos && (
        <>
          <div className="rounded-2xl border border-border-soft bg-panel p-5">
            <h3 className="mb-4 text-sm font-bold text-white">📈 Evolución de riesgos</h3>
            <div className="h-72">
              <Line data={datosGrafico} options={opcionesGrafico} />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3 text-center">Productos</th>
                  <th className="px-4 py-3 text-center">Vencidos</th>
                  <th className="px-4 py-3 text-center">Por vencer</th>
                  <th className="px-4 py-3 text-center">Stock crítico</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {[...snapshots].reverse().map((s) => (
                  <tr key={s._id} className="bg-slate-950/50">
                    <td className="px-4 py-2.5 font-semibold text-white">{formatearFecha(s.fecha)}</td>
                    <td className="px-4 py-2.5 text-center text-slate-300">{s.totales.totalProductos}</td>
                    <td className="px-4 py-2.5 text-center text-red-400">{s.totales.vencidos}</td>
                    <td className="px-4 py-2.5 text-center text-amber-400">{s.totales.porVencer}</td>
                    <td className="px-4 py-2.5 text-center text-purple-400">{s.totales.stockCritico}</td>
                    <td className="px-4 py-2.5 text-right text-white">{fmtMoneda(s.totales.valorInventario)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold text-white">📦 Productos por categoría</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-900 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Fecha</th>
                    {CATS.map((c) => (
                      <th key={c} className="px-4 py-3 text-center">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {[...snapshots].reverse().map((s) => (
                    <tr key={s._id} className="bg-slate-950/50">
                      <td className="px-4 py-2.5 font-semibold text-white">{formatearFecha(s.fecha)}</td>
                      {CATS.map((c) => (
                        <td key={c} className="px-4 py-2.5 text-center text-slate-300">{cat(s.totales, c)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

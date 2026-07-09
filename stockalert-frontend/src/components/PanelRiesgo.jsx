import * as XLSX from "xlsx";
import { Siren, Trophy } from "lucide-react";

function diasParaVencer(vencimiento) {
  return Math.ceil((new Date(vencimiento) - new Date()) / (1000 * 60 * 60 * 24));
}

function calcularRiesgo(producto) {
  const dias = diasParaVencer(producto.vencimiento);
  const stock = Number(producto.stock || 0);
  let puntaje = 0;
  const motivos = [];

  if (dias < 0) { puntaje += 100; motivos.push({ texto: "Vencido", color: "#ef4444", pts: 100 }); }
  else if (dias <= 7) { puntaje += 60; motivos.push({ texto: "Por vencer", color: "#eab308", pts: 60 }); }

  if (stock <= 0) { puntaje += 50; motivos.push({ texto: "Agotado", color: "#b91c1c", pts: 50 }); }
  else if (stock <= 5) { puntaje += 40; motivos.push({ texto: "Stock crítico", color: "#a855f7", pts: 40 }); }
  else if (stock <= 10) { puntaje += 25; motivos.push({ texto: "Stock bajo", color: "#f97316", pts: 25 }); }

  const valor = stock * Number(producto.precio || 0);
  puntaje += Math.min(valor / 10000, 50);

  const motivoPrincipal = motivos.sort((a, b) => b.pts - a.pts)[0] || { texto: "En riesgo", color: "#64748b" };
  return { puntaje, motivoPrincipal };
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function descargarExcel(filas, nombreArchivo, nombreHoja) {
  if (!filas || filas.length === 0) return;
  const hoja = XLSX.utils.json_to_sheet(filas);
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, nombreHoja);
  const fecha = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(libro, nombreArchivo + "_" + fecha + ".xlsx");
}

function BotonDescarga({ onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title="Descargar en Excel"
      className="flex items-center gap-1 rounded-lg bg-green-600/15 px-2.5 py-1 text-[11px] font-semibold text-green-400 transition-colors hover:bg-green-600/25 disabled:opacity-40"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Excel
    </button>
  );
}

function BadgePrioridad({ motivo }) {
  return (
    <span
      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ backgroundColor: motivo.color + "1a", color: motivo.color }}
    >
      {motivo.texto}
    </span>
  );
}

export default function PanelRiesgo({ productos }) {
  const conRiesgo = (productos || [])
    .map((p) => ({ ...p, ...calcularRiesgo(p) }))
    .filter((p) => p.puntaje > 0)
    .sort((a, b) => b.puntaje - a.puntaje);

  const top10 = conRiesgo.slice(0, 10);
  const urgentes = conRiesgo.filter((p) => {
    const dias = diasParaVencer(p.vencimiento);
    return dias < 0 || dias <= 7 || Number(p.stock) <= 5;
  });

  function descargarUrgentes() {
    const filas = urgentes.map((p) => ({
      Producto: p.nombre,
      Lote: p.lote || "",
      Sucursal: p.sucursal?.nombre || "",
      Vence: formatearFecha(p.vencimiento),
      Stock: p.stock,
      Prioridad: p.motivoPrincipal.texto
    }));
    descargarExcel(filas, "acciones_urgentes", "Urgentes");
  }

  function descargarTop10() {
    const filas = top10.map((p, i) => ({
      Puesto: i + 1,
      Producto: p.nombre,
      Lote: p.lote || "",
      Sucursal: p.sucursal?.nombre || "",
      Vence: formatearFecha(p.vencimiento),
      Stock: p.stock,
      Riesgo: p.motivoPrincipal.texto,
      Puntaje: Math.round(p.puntaje)
    }));
    descargarExcel(filas, "top10_en_riesgo", "Top10");
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Acciones urgentes */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 lg:col-span-2">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-white">🚨 Acciones urgentes</h2>
          <BotonDescarga onClick={descargarUrgentes} disabled={urgentes.length === 0} />
        </div>
        {urgentes.length === 0 ? (
          <p className="text-sm text-slate-500">No hay acciones urgentes. Todo en orden.</p>
        ) : (
          <>
            {/* TABLA - solo escritorio */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-xs">
                <thead className="text-left uppercase text-slate-500">
                  <tr>
                    <th className="px-2 py-2">Producto</th>
                    <th className="px-2 py-2">Lote</th>
                    <th className="px-2 py-2">Sucursal</th>
                    <th className="px-2 py-2">Vence</th>
                    <th className="px-2 py-2 text-center">Stock</th>
                    <th className="px-2 py-2">Prioridad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {urgentes.slice(0, 8).map((p) => (
                    <tr key={p._id}>
                      <td className="px-2 py-2 font-semibold text-white">{p.nombre}</td>
                      <td className="px-2 py-2 text-slate-400">{p.lote || "—"}</td>
                      <td className="px-2 py-2 text-slate-400">{p.sucursal?.nombre || "—"}</td>
                      <td className="px-2 py-2 text-slate-400">{formatearFecha(p.vencimiento)}</td>
                      <td className="px-2 py-2 text-center text-white">{p.stock}</td>
                      <td className="px-2 py-2"><BadgePrioridad motivo={p.motivoPrincipal} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* TARJETAS - solo móvil (sin scroll lateral) */}
            <div className="space-y-2 md:hidden">
              {urgentes.slice(0, 8).map((p) => (
                <div key={p._id} className="flex items-center gap-3 rounded-lg bg-slate-950/50 p-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{p.nombre}</p>
                    <p className="text-[10px] text-slate-500">
                      {p.sucursal?.nombre ? p.sucursal.nombre + " · " : ""}Lote: {p.lote || "—"} · Vence: {formatearFecha(p.vencimiento)} · Stock: {p.stock}
                    </p>
                  </div>
                  <BadgePrioridad motivo={p.motivoPrincipal} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Top 10 en riesgo */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-white">🏆 Top 10 en riesgo</h2>
          <BotonDescarga onClick={descargarTop10} disabled={top10.length === 0} />
        </div>
        {top10.length === 0 ? (
          <p className="text-sm text-slate-500">No hay productos riesgosos.</p>
        ) : (
          <div className="space-y-2">
            {top10.map((p, i) => (
              <div key={p._id} className="flex items-center gap-3 rounded-lg bg-slate-950/50 p-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-white">
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{p.nombre}</p>
                  <p className="text-[10px] text-slate-500">
                    Lote: {p.lote || "Sin lote"} · Vence: {formatearFecha(p.vencimiento)}
                  </p>
                </div>
                <BadgePrioridad motivo={p.motivoPrincipal} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

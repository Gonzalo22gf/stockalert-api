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

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Acciones urgentes */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 lg:col-span-2">
        <h2 className="mb-3 text-sm font-semibold text-white">🚨 Acciones urgentes</h2>
        {urgentes.length === 0 ? (
          <p className="text-sm text-slate-500">No hay acciones urgentes. Todo en orden.</p>
        ) : (
          <div className="overflow-x-auto">
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
                    <td className="px-2 py-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ backgroundColor: `${p.motivoPrincipal.color}1a`, color: p.motivoPrincipal.color }}
                      >
                        {p.motivoPrincipal.texto}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top 10 en riesgo */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">🏆 Top 10 en riesgo</h2>
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
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ backgroundColor: `${p.motivoPrincipal.color}1a`, color: p.motivoPrincipal.color }}
                >
                  {p.motivoPrincipal.texto}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
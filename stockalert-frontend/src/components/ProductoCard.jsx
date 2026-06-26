function obtenerEstado(vencimiento) {
  const hoy = new Date();
  const fecha = new Date(vencimiento);
  const dias = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
  if (dias < 0) return { texto: "Vencido", color: "bg-red-500/15 text-red-400" };
  if (dias <= 7) return { texto: "Por vencer", color: "bg-amber-500/15 text-amber-400" };
  return { texto: "En buen estado", color: "bg-emerald-500/15 text-emerald-400" };
}

function obtenerEstadoStock(stock) {
  if (stock <= 0) return { texto: "Agotado", color: "bg-red-500/15 text-red-400" };
  if (stock <= 5) return { texto: "Stock crítico", color: "bg-purple-500/15 text-purple-400" };
  if (stock <= 10) return { texto: "Stock bajo", color: "bg-amber-500/15 text-amber-400" };
  return { texto: "Stock normal", color: "bg-slate-700/60 text-slate-300" };
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function ProductoCard({ producto, esAdmin, onEditar, onEliminar }) {
  const estado = obtenerEstado(producto.vencimiento);
  const estadoStock = obtenerEstadoStock(producto.stock);

  return (
    <div className="animate-rise rounded-2xl border border-border-soft bg-panel p-[18px] transition-all duration-200 hover:-translate-y-1 hover:border-border hover:shadow-xl hover:shadow-black/30">
      <div className="mb-1 flex items-start justify-between gap-2">
        <span className="font-semibold text-white">{producto.nombre}</span>
        {esAdmin && producto.sucursal?.nombre && (
          <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand-400">
            {producto.sucursal.nombre}
          </span>
        )}
      </div>
      <p className="mb-3.5 text-xs font-medium uppercase tracking-wide text-slate-600">{producto.categoria}</p>

      <div className="mb-3.5 grid grid-cols-3 gap-2 rounded-xl bg-base/60 p-3 text-center">
        <div>
          <p className="text-base font-bold text-white">{producto.stock}</p>
          <p className="text-[10px] uppercase tracking-wide text-slate-600">Stock</p>
        </div>
        <div className="border-x border-border-soft">
          <p className="text-base font-bold text-white">${Number(producto.precio).toLocaleString("es-AR")}</p>
          <p className="text-[10px] uppercase tracking-wide text-slate-600">Precio</p>
        </div>
        <div>
          <p className="text-[13px] font-bold text-white">{formatearFecha(producto.vencimiento)}</p>
          <p className="text-[10px] uppercase tracking-wide text-slate-600">Vence</p>
        </div>
      </div>

      <div className="mb-3.5 flex flex-wrap gap-1.5">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${estado.color}`}>{estado.texto}</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${estadoStock.color}`}>{estadoStock.texto}</span>
        {producto.lote && (
          <span className="rounded-full bg-panel-hover px-2 py-0.5 text-[10px] font-medium text-slate-400">
            Lote {producto.lote}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onEditar(producto)}
          className="flex-1 rounded-lg bg-brand/10 py-2 text-xs font-semibold text-brand-400 transition-colors hover:bg-brand/20"
        >
          Editar
        </button>
        <button
          onClick={() => onEliminar(producto)}
          className="flex-1 rounded-lg bg-red-500/10 py-2 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}
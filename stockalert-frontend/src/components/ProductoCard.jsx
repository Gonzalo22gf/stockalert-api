function obtenerEstado(vencimiento) {
  const hoy = new Date();
  const fecha = new Date(vencimiento);
  const dias = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
  if (dias < 0) return { texto: "Vencido", color: "bg-red-500/15 text-red-400" };
  if (dias <= 7) return { texto: "Por vencer", color: "bg-yellow-500/15 text-yellow-400" };
  return { texto: "En buen estado", color: "bg-green-500/15 text-green-400" };
}

function obtenerEstadoStock(stock) {
  if (stock <= 0) return { texto: "Agotado", color: "bg-red-500/15 text-red-400" };
  if (stock <= 5) return { texto: "Stock crítico", color: "bg-purple-500/15 text-purple-400" };
  if (stock <= 10) return { texto: "Stock bajo", color: "bg-orange-500/15 text-orange-400" };
  return { texto: "Stock normal", color: "bg-slate-700 text-slate-300" };
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function ProductoCard({ producto, esAdmin, onEditar, onEliminar }) {
  const estado = obtenerEstado(producto.vencimiento);
  const estadoStock = obtenerEstadoStock(producto.stock);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="mb-1 flex items-start justify-between gap-2">
        <span className="font-semibold text-white">{producto.nombre}</span>
        {esAdmin && producto.sucursal?.nombre && (
          <span className="shrink-0 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-medium text-brand">
            {producto.sucursal.nombre}
          </span>
        )}
      </div>
      <p className="mb-3 text-xs text-slate-500">{producto.categoria}</p>

      <div className="mb-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-sm font-bold text-white">{producto.stock}</p>
          <p className="text-[10px] text-slate-500">Stock</p>
        </div>
        <div>
          <p className="text-sm font-bold text-white">${Number(producto.precio).toLocaleString("es-AR")}</p>
          <p className="text-[10px] text-slate-500">Precio</p>
        </div>
        <div>
          <p className="text-sm font-bold text-white">{formatearFecha(producto.vencimiento)}</p>
          <p className="text-[10px] text-slate-500">Vence</p>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${estado.color}`}>{estado.texto}</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${estadoStock.color}`}>{estadoStock.texto}</span>
        {producto.lote && (
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
            Lote {producto.lote}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onEditar(producto)}
          className="flex-1 rounded-lg bg-brand/15 py-1.5 text-xs font-semibold text-brand hover:bg-brand/25"
        >
          Editar
        </button>
        <button
          onClick={() => onEliminar(producto)}
          className="flex-1 rounded-lg bg-red-500/15 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/25"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}
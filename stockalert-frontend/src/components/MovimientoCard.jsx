const TIPOS = {
  creacion: { texto: "Creado", color: "bg-green-500/15 text-green-400" },
  edicion: { texto: "Editado", color: "bg-yellow-500/15 text-yellow-400" },
  eliminacion: { texto: "Eliminado", color: "bg-red-500/15 text-red-400" }
};

function formatearFechaHora(fecha) {
  return new Date(fecha).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function MovimientoCard({ movimiento }) {
  const tipo = TIPOS[movimiento.tipo] || { texto: movimiento.tipo, color: "bg-slate-700 text-slate-300" };

  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="min-w-0">
        <div className="mb-1 flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${tipo.color}`}>{tipo.texto}</span>
          <span className="truncate font-semibold text-white">{movimiento.nombreProducto || "Producto"}</span>
        </div>
        <p className="text-xs text-slate-500">
          {movimiento.usuario?.nombre || "Usuario"} · {movimiento.sucursal?.nombre || "Sucursal"}
        </p>
      </div>
      <p className="shrink-0 text-xs text-slate-400">{formatearFechaHora(movimiento.createdAt)}</p>
    </div>
  );
}
import { useTranslation } from "react-i18next";
const TIPOS = {
  creacion: { texto: "movimientos.creado", color: "bg-green-500/15 text-green-400" },
  edicion: { texto: "movimientos.editado", color: "bg-yellow-500/15 text-yellow-400" },
  eliminacion: { texto: "movimientos.eliminado", color: "bg-red-500/15 text-red-400" }
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
  const { t } = useTranslation();
  const tipo = TIPOS[movimiento.tipo] || { texto: movimiento.tipo, color: "bg-slate-700 text-slate-300" };
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="min-w-0">
        <div className="mb-1 flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${tipo.color}`}>{t(tipo.texto)}</span>
          <span className="truncate font-semibold text-white">{movimiento.nombreProducto || t("movimientos.producto")}</span>
        </div>
        <p className="text-xs text-slate-500">
          {movimiento.usuario?.nombre || t("movimientos.usuario")}
          {movimiento.sucursal?.nombre ? ` · ${movimiento.sucursal.nombre}` : ""}
        </p>
      </div>
      <p className="shrink-0 text-xs text-slate-400">{formatearFechaHora(movimiento.createdAt)}</p>
    </div>
  );
}

import { useCountUp } from "../hooks/useCountUp";

const COLORES = {
  indigo: "#6366f1",
  emerald: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  purple: "#a855f7"
};

export default function KpiCard({ etiqueta, valor, descripcion, color = "indigo", prefijo = "", delay = 0, esNumero = true }) {
  const valorNumerico = esNumero ? useCountUp(valor) : 0;
  const mostrar = esNumero ? prefijo + Math.round(valorNumerico).toLocaleString("es-AR") : valor;

  return (
    <div
      className="animate-rise rounded-2xl border border-border-soft bg-panel p-[18px] transition-all duration-200 hover:-translate-y-[3px] hover:border-border"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="mb-2.5 flex items-center gap-[7px]">
        <span className="h-[7px] w-[7px] rounded-full" style={{ backgroundColor: COLORES[color] }} />
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">{etiqueta}</p>
      </div>
      <p className="text-[28px] font-extrabold tracking-tight text-white">{mostrar}</p>
      {descripcion && <p className="mt-1 text-[11.5px] text-slate-600">{descripcion}</p>}
    </div>
  );
}
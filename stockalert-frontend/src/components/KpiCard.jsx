const COLORES = {
  red: "border-red-500/30 bg-red-500/5 text-red-400",
  orange: "border-orange-500/30 bg-orange-500/5 text-orange-400",
  yellow: "border-yellow-500/30 bg-yellow-500/5 text-yellow-400",
  green: "border-green-500/30 bg-green-500/5 text-green-400",
  blue: "border-blue-500/30 bg-blue-500/5 text-blue-400",
  purple: "border-purple-500/30 bg-purple-500/5 text-purple-400"
};

export default function KpiCard({ etiqueta, valor, descripcion, color = "blue", icono }) {
  return (
    <div className={`rounded-xl border p-4 ${COLORES[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{etiqueta}</p>
          <p className="mt-1 text-2xl font-bold text-white">{valor}</p>
          {descripcion && <p className="mt-1 text-xs text-slate-500">{descripcion}</p>}
        </div>
        {icono && <div className="text-2xl">{icono}</div>}
      </div>
    </div>
  );
}
export default function EmptyState({ icono = "📦", titulo, descripcion }) {
  return (
    <div className="animate-fade flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-panel/50 px-6 py-14 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-panel text-2xl">
        {icono}
      </div>
      <p className="text-sm font-semibold text-slate-300">{titulo}</p>
      {descripcion && <p className="mt-1 max-w-xs text-xs text-slate-600">{descripcion}</p>}
    </div>
  );
}
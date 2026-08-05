import { useState } from "react";
import { KeyRound, Copy, Check, Users } from "lucide-react";
import { usePerfilEmpresa } from "../empresa/useEmpresa";

export default function CodigoAccesoPage() {
  const { data: empresa, isLoading } = usePerfilEmpresa();
  const [copiado, setCopiado] = useState(false);

  function copiarCodigo() {
    if (!empresa?.codigoAcceso) return;
    navigator.clipboard.writeText(empresa.codigoAcceso);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  if (isLoading) return <p className="text-sm text-slate-500">Cargando...</p>;

  return (
    <div className="animate-rise max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-bold text-white">Codigo de acceso</h1>
        <p className="text-sm text-slate-400">Compartilo con tu equipo para que puedan unirse a tu empresa.</p>
      </div>

      <div className="rounded-2xl border border-border-soft bg-panel p-8 text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10">
          <KeyRound size={28} className="text-brand-400" />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">{empresa?.nombre}</p>
          <p className="text-5xl font-bold tracking-[0.2em] text-brand-400">{empresa?.codigoAcceso || "---"}</p>
        </div>

        <button
          onClick={copiarCodigo}
          className="mx-auto flex items-center gap-2 rounded-xl bg-brand/10 px-6 py-3 text-sm font-semibold text-brand-400 hover:bg-brand/20 transition-colors"
        >
          {copiado ? <Check size={16} /> : <Copy size={16} />}
          {copiado ? "Copiado al portapapeles" : "Copiar codigo"}
        </button>
      </div>

      <div className="rounded-2xl border border-border-soft bg-panel p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Users size={16} className="text-slate-500" />
          Como unirse con este codigo
        </div>
        <ol className="space-y-2 text-sm text-slate-400 list-decimal list-inside">
          <li>El nuevo integrante abre <span className="text-brand-400 font-medium">mistockalert.com</span></li>
          <li>En la pantalla de login hace click en <span className="text-white font-medium">Crear cuenta</span></li>
          <li>Selecciona <span className="text-white font-medium">Unirme a una empresa</span></li>
          <li>Ingresa el codigo <span className="text-brand-400 font-bold tracking-widest">{empresa?.codigoAcceso}</span> y el numero de su sucursal</li>
          <li>Completa sus datos y listo</li>
        </ol>
      </div>
    </div>
  );
}
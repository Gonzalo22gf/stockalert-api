import { Copy, Check, Link, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { usePerfilEmpresa } from "./useEmpresa";
import { useLinks } from "./useLinks";
import { useNavigate } from "react-router-dom";
export default function WidgetEmpresa() {
  const { t } = useTranslation();
  const { data: empresa } = usePerfilEmpresa();
  const { data: links = [] } = useLinks();
  const [copiado, setCopiado] = useState(false);
  const navigate = useNavigate();
  function copiarCodigo() {
    if (!empresa?.codigoAcceso) return;
    navigator.clipboard.writeText(empresa.codigoAcceso);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-2xl border border-border-soft bg-panel p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("empresa.codigoInvitacion")}</p>
        <div className="flex items-center gap-3">
          <p className="text-2xl font-bold tracking-widest text-brand-400">{empresa?.codigoAcceso || "..."}</p>
          <button onClick={copiarCodigo} className="ml-auto flex items-center gap-1.5 rounded-lg bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand-400 hover:bg-brand/20 transition-colors">
            {copiado ? <Check size={13} /> : <Copy size={13} />}
            {copiado ? t("empresa.copiado") : t("empresa.copiar")}
          </button>
        </div>
        <p className="text-[11px] text-slate-600">
          <Trans i18nKey="empresa.compartilo" values={{ nombre: empresa?.nombre }}>
            Compartilo con tu equipo para que puedan unirse a <b className="text-slate-500">{{ nombre: empresa?.nombre }}</b>.
          </Trans>
        </p>
      </div>
      <div className="rounded-2xl border border-border-soft bg-panel p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("empresa.linksFrecuentes")}</p>
          <button onClick={() => navigate("/links")} className="text-[11px] text-brand-400 hover:underline">{t("empresa.gestionar")}</button>
        </div>
        {links.length === 0 ? (
          <p className="text-xs text-slate-600">{t("empresa.noLinks")} <button onClick={() => navigate("/links")} className="text-brand-400 hover:underline">{t("empresa.agregar")}</button></p>
        ) : (
          <div className="space-y-1.5">
            {links.slice(0, 5).map((link) => (
              <a key={link._id} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-base/60 transition-colors group">
                <Link size={12} className="shrink-0 text-slate-600 group-hover:text-brand-400" />
                <span className="text-xs text-slate-300 truncate group-hover:text-white">{link.nombre}</span>
                <ExternalLink size={11} className="ml-auto shrink-0 text-slate-700 group-hover:text-slate-400" />
              </a>
            ))}
            {links.length > 5 && (
              <p className="text-[11px] text-slate-600 pl-2">{t("empresa.masEn", { n: links.length - 5 })} <button onClick={() => navigate("/links")} className="text-brand-400 hover:underline">{t("empresa.linksFrecuentes")}</button></p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

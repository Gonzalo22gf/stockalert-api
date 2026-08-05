import { useState } from "react";
import { KeyRound, Copy, Check, Users, Share2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePerfilEmpresa } from "../empresa/useEmpresa";

export default function CodigoAccesoPage() {
  const { t } = useTranslation();
  const { data: empresa, isLoading } = usePerfilEmpresa();
  const [copiado, setCopiado] = useState(false);
  const puedeCompartir = typeof navigator !== "undefined" && !!navigator.share;

  function copiarCodigo() {
    if (!empresa?.codigoAcceso) return;
    navigator.clipboard.writeText(empresa.codigoAcceso);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  function compartirCodigo() {
    if (!empresa?.codigoAcceso) return;
    navigator.share({
      title: "StockAlert — " + t("codigoAcceso.titulo"),
      text: "Unite a " + empresa.nombre + " en StockAlert con el codigo: " + empresa.codigoAcceso + "\n\nhttps://mistockalert.com"
    }).catch(() => {});
  }

  if (isLoading) return <p className="text-sm text-slate-500">{t("codigoAcceso.cargando")}</p>;

  return (
    <div className="animate-rise max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-bold text-white">{t("codigoAcceso.titulo")}</h1>
        <p className="text-sm text-slate-400">{t("codigoAcceso.subtitulo")}</p>
      </div>

      <div className="rounded-2xl border border-border-soft bg-panel p-8 text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10">
          <KeyRound size={28} className="text-brand-400" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">{empresa?.nombre}</p>
          <p className="text-5xl font-bold tracking-[0.2em] text-brand-400">{empresa?.codigoAcceso || "---"}</p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button onClick={copiarCodigo} className="flex items-center gap-2 rounded-xl bg-brand/10 px-5 py-3 text-sm font-semibold text-brand-400 hover:bg-brand/20 transition-colors">
            {copiado ? <Check size={16} /> : <Copy size={16} />}
            {copiado ? t("codigoAcceso.copiado") : t("codigoAcceso.copiar")}
          </button>
          {puedeCompartir && (
            <button onClick={compartirCodigo} className="flex items-center gap-2 rounded-xl bg-slate-700/40 px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-700/70 transition-colors">
              <Share2 size={16} />
              {t("codigoAcceso.compartir")}
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border-soft bg-panel p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Users size={16} className="text-slate-500" />
          {t("codigoAcceso.comoUnirse")}
        </div>
        <ol className="space-y-2 text-sm text-slate-400 list-decimal list-inside">
          <li>{t("codigoAcceso.paso1")} <span className="text-brand-400 font-medium">mistockalert.com</span></li>
          <li>{t("codigoAcceso.paso2")} <span className="text-white font-medium">{t("codigoAcceso.crearCuenta")}</span></li>
          <li>{t("codigoAcceso.paso3")} <span className="text-white font-medium">{t("codigoAcceso.unirseTitulo")}</span></li>
          <li>{t("codigoAcceso.paso4")} <span className="text-brand-400 font-bold tracking-widest">{empresa?.codigoAcceso}</span> {t("codigoAcceso.paso4b")}</li>
          <li>{t("codigoAcceso.paso5")}</li>
        </ol>
      </div>
    </div>
  );
}

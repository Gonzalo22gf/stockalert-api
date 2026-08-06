import { useTranslation } from "react-i18next";
import { TrendingUp, X } from "lucide-react";

const LANDING_URL = "https://mistockalert.com/#precios";

const MENSAJES = {
  LIMITE_PRODUCTOS:  { emoji: "📦", clave: "upgrade.limiteProductos" },
  LIMITE_SUCURSALES: { emoji: "🏪", clave: "upgrade.limiteSucursales" },
  LIMITE_USUARIOS:   { emoji: "👥", clave: "upgrade.limiteUsuarios" },
  TRIAL_EXPIRADO:    { emoji: "⏰", clave: "upgrade.trialExpirado" }
};

export default function ModalUpgrade({ codigo, onCerrar }) {
  const { t } = useTranslation();
  const info = MENSAJES[codigo] || { emoji: "🚀", clave: "upgrade.limiteGenerico" };
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onCerrar} />
      <div className="relative w-full max-w-md rounded-2xl border border-border-soft bg-panel p-8 text-center shadow-2xl">
        <button onClick={onCerrar} className="absolute right-4 top-4 text-slate-500 hover:text-white transition-colors">
          <X size={18} />
        </button>
        <div className="text-5xl mb-4">{info.emoji}</div>
        <h2 className="text-lg font-bold text-white mb-2">{t("upgrade.titulo")}</h2>
        <p className="text-sm text-slate-400 mb-6">{t(info.clave)}</p>
        <div className="flex flex-col gap-3">
          <a
            href={LANDING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand/80"
          >
            <TrendingUp size={16} />
            {t("upgrade.verPlanes")}
          </a>
          <button
            onClick={onCerrar}
            className="rounded-xl border border-border px-6 py-3 text-sm font-semibold text-slate-400 transition hover:bg-panel-hover hover:text-white"
          >
            {t("upgrade.ahoreNo")}
          </button>
        </div>
      </div>
    </div>
  );
}
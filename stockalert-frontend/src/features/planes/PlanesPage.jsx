import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { usePlanes } from "./usePlanes";
import { useAuthStore } from "../auth/authStore";
const PLANES = [
  { id: "starter", nombre: "Starter", precio: "$9", descripcion: "planes.starterDesc", destacado: false, features: ["planes.f1Sucursal", "planes.fHasta50", "planes.fAlertas", "planes.fExcel", "planes.fSoporteEmail"] },
  { id: "pro", nombre: "Pro", precio: "$29", descripcion: "planes.proDesc", destacado: true, features: ["planes.fHasta10Suc", "planes.fProdIlimitados", "planes.fDashMulti", "planes.fRankings", "planes.fUsuariosRoles", "planes.fSoportePrioritario"] },
  { id: "business", nombre: "Business", precio: "$79", descripcion: "planes.businessDesc", destacado: false, features: ["planes.fSucIlimitadas", "planes.fProdIlimitados", "planes.fUsuariosIlimitados", "planes.fReportesAvanzados", "planes.fSoporteWhatsapp", "planes.fOnboarding"] }
];
export default function PlanesPage() {
  const { t } = useTranslation();
  const { irACheckout, cargando } = usePlanes();
  const usuario = useAuthStore((s) => s.usuario);
  const [searchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      Swal.fire({ icon: "success", title: t("planes.pagoExitoso"), text: t("planes.pagoActivado"), confirmButtonText: t("planes.recargar") })
        .then(() => window.location.replace("/"));
    }
  }, [searchParams, t]);
  if (usuario?.rol !== "admin") {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-500">{t("planes.soloAdmin")}</p>
      </div>
    );
  }
  return (
    <div className="space-y-8 animate-rise">
      <div>
        <h1 className="text-lg font-bold text-white">{t("planes.titulo")}</h1>
        <p className="text-sm text-slate-400">{t("planes.subtitulo")}</p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {PLANES.map((plan) => (
          <div key={plan.id} className={"relative rounded-2xl border p-6 flex flex-col gap-4 " + (plan.destacado ? "border-indigo-400/40 bg-indigo-500/5" : "border-slate-800 bg-white/[0.02]")}>
            {plan.destacado && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-500 px-3 py-0.5 text-[11px] font-bold text-white">{t("planes.masPopular")}</span>}
            <div>
              <h2 className="text-base font-bold text-white">{plan.nombre}</h2>
              <p className="mt-1 text-sm text-slate-400">{t(plan.descripcion)}</p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-white">{plan.precio}</span>
              <span className="text-sm text-slate-500">{t("planes.mes")}</span>
            </div>
            <ul className="space-y-2 flex-1">
              {plan.features.map((f) => <li key={f} className="flex items-center gap-2 text-sm text-slate-300"><span className="text-indigo-400">✓</span>{t(f)}</li>)}
            </ul>
            <button onClick={() => irACheckout(plan.id)} disabled={cargando === plan.id} className={"w-full rounded-xl py-3 text-sm font-semibold transition-colors " + (plan.destacado ? "bg-indigo-500 text-white hover:bg-indigo-400" : "border border-slate-700 text-slate-300 hover:bg-slate-800")}>
              {cargando === plan.id ? t("planes.redirigiendo") : t("planes.suscribirme")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { usePlanes } from "./usePlanes";
import { useAuthStore } from "../auth/authStore";
import { obtenerPerfilEmpresa } from "../empresa/empresa.api";

// Cada plan tiene su color de acento para que las opciones se distingan y llamen la atencion.
// Las clases se escriben completas (no interpoladas) para que Tailwind las detecte en el build.
const PLANES = [
  {
    id: "starter",
    nombre: "Starter",
    precio: "$9",
    descripcion: "planes.starterDesc",
    destacado: false,
    features: ["planes.f1Sucursal", "planes.fHasta50", "planes.fEquipo5", "planes.fAlertas", "planes.fExcel", "planes.fSoporteEmail"],
    borde: "border-sky-400/30",
    fondo: "bg-sky-500/[0.06]",
    check: "text-sky-400",
    boton: "bg-sky-500/15 text-sky-300 hover:bg-sky-500 hover:text-white"
  },
  {
    id: "pro",
    nombre: "Pro",
    precio: "$29",
    descripcion: "planes.proDesc",
    destacado: true,
    features: ["planes.fIncluyeStarter", "planes.fHasta10Suc", "planes.fProd300", "planes.fEquipo15", "planes.fDashMulti", "planes.fRankings", "planes.fHistorial", "planes.fSoportePrioritario"],
    borde: "border-brand-400/50",
    fondo: "bg-brand-500/[0.08]",
    check: "text-brand-400",
    boton: "bg-brand-500 text-white hover:bg-brand-400"
  },
  {
    id: "business",
    nombre: "Business",
    precio: "$79",
    descripcion: "planes.businessDesc",
    destacado: false,
    features: ["planes.fIncluyeTodo", "planes.fSucIlimitadas", "planes.fProdIlimitados", "planes.fEquipoIlim", "planes.fReportesAvanzados", "planes.fSoporteWhatsapp", "planes.fOnboarding"],
    borde: "border-purple-400/30",
    fondo: "bg-purple-500/[0.06]",
    check: "text-purple-400",
    boton: "bg-purple-500/15 text-purple-300 hover:bg-purple-500 hover:text-white"
  }
];

export default function PlanesPage() {
  const { t } = useTranslation();
  const { irACheckout, cargando } = usePlanes();
  const usuario = useAuthStore((s) => s.usuario);
  const actualizarPlan = useAuthStore((s) => s.actualizarPlan);
  const planActual = usuario?.empresa?.plan || null;
  const [searchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get("success") !== "true") return;
    // Tras pagar: traer el plan fresco del backend y actualizar la sesion (el webhook ya
    // escribio el plan; asi la UI lo refleja sin necesidad de re-loguear).
    (async () => {
      try {
        const empresa = await obtenerPerfilEmpresa();
        if (empresa?.plan) actualizarPlan(empresa.plan);
      } catch {
        // si falla, el plan igual esta en el backend; se vera al proximo login
      }
      await Swal.fire({ icon: "success", title: t("planes.pagoExitoso"), text: t("planes.pagoActivado"), confirmButtonText: t("planes.recargar") });
      window.location.replace("/");
    })();
  }, [searchParams, t, actualizarPlan]);
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
          <div
            key={plan.id}
            className={"relative rounded-2xl border p-6 flex flex-col gap-4 transition-transform duration-200 hover:-translate-y-1 " + plan.borde + " " + plan.fondo + (plan.destacado ? " shadow-lg shadow-brand/10" : "")}
          >
            {plan.destacado && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-3 py-0.5 text-[11px] font-bold text-white">{t("planes.masPopular")}</span>}
            <div>
              <h2 className="text-base font-bold text-white">{plan.nombre}</h2>
              <p className="mt-1 text-sm text-slate-400">{t(plan.descripcion)}</p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-white">{plan.precio}</span>
              <span className="text-sm text-slate-500">{t("planes.mes")}</span>
            </div>
            <ul className="space-y-2 flex-1">
              {plan.features.map((f) => <li key={f} className="flex items-center gap-2 text-sm text-slate-300"><span className={plan.check}>✓</span>{t(f)}</li>)}
            </ul>
            {plan.id === planActual ? (
              <button disabled className="w-full rounded-xl py-3 text-sm font-semibold border border-current opacity-70 cursor-default ">
                {t("planes.planActual")}
              </button>
            ) : (
              <button
                onClick={() => irACheckout(plan.id)}
                disabled={cargando === plan.id}
                className={"w-full rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-60 " + plan.boton}
              >
                {cargando === plan.id ? t("planes.redirigiendo") : t("planes.suscribirme")}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

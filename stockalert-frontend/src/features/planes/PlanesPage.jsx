import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import Swal from "sweetalert2";
import { usePlanes } from "./usePlanes";
import { useAuthStore } from "../auth/authStore";

const PLANES = [
  { id: "starter", nombre: "Starter", precio: "$9", descripcion: "Para un solo local que quiere ordenar su inventario.", destacado: false, features: ["1 sucursal", "Hasta 50 productos", "Alertas de vencimiento", "Exportacion Excel", "Soporte por email"] },
  { id: "pro", nombre: "Pro", precio: "$29", descripcion: "Para negocios con varias sucursales que necesitan una vista unificada.", destacado: true, features: ["Hasta 10 sucursales", "Productos ilimitados", "Dashboard multi-sucursal", "Rankings de riesgo", "Usuarios con roles", "Soporte prioritario"] },
  { id: "business", nombre: "Business", precio: "$79", descripcion: "Para cadenas y franquicias que gestionan inventario a escala.", destacado: false, features: ["Sucursales ilimitadas", "Productos ilimitados", "Usuarios ilimitados", "Reportes avanzados", "Soporte WhatsApp", "Onboarding guiado"] }
];

export default function PlanesPage() {
  const { irACheckout, cargando } = usePlanes();
  const usuario = useAuthStore((s) => s.usuario);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      Swal.fire({ icon: "success", title: "Pago exitoso", text: "Tu plan fue activado. Recarga la app para ver los cambios.", confirmButtonText: "Recargar" })
        .then(() => window.location.replace("/"));
    }
  }, [searchParams]);

  if (usuario?.rol !== "admin") {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-500">Solo los administradores pueden gestionar el plan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-rise">
      <div>
        <h1 className="text-lg font-bold text-white">Planes</h1>
        <p className="text-sm text-slate-400">Elegí el plan que mejor se adapta a tu negocio.</p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {PLANES.map((plan) => (
          <div key={plan.id} className={"relative rounded-2xl border p-6 flex flex-col gap-4 " + (plan.destacado ? "border-indigo-400/40 bg-indigo-500/5" : "border-slate-800 bg-white/[0.02]")}>
            {plan.destacado && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-500 px-3 py-0.5 text-[11px] font-bold text-white">Mas popular</span>}
            <div>
              <h2 className="text-base font-bold text-white">{plan.nombre}</h2>
              <p className="mt-1 text-sm text-slate-400">{plan.descripcion}</p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-white">{plan.precio}</span>
              <span className="text-sm text-slate-500">/mes</span>
            </div>
            <ul className="space-y-2 flex-1">
              {plan.features.map((f) => <li key={f} className="flex items-center gap-2 text-sm text-slate-300"><span className="text-indigo-400">✓</span>{f}</li>)}
            </ul>
            <button onClick={() => irACheckout(plan.id)} disabled={cargando === plan.id} className={"w-full rounded-xl py-3 text-sm font-semibold transition-colors " + (plan.destacado ? "bg-indigo-500 text-white hover:bg-indigo-400" : "border border-slate-700 text-slate-300 hover:bg-slate-800")}>
              {cargando === plan.id ? "Redirigiendo..." : "Suscribirme"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
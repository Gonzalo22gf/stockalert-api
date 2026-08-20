import { useAuthStore } from "../../features/auth/authStore";
import { useTranslation } from "react-i18next";
import { useMetricasSuperadmin, useEmpresasSuperadmin, useToggleEmpresa, useEliminarEmpresa } from "./useSuperadmin";
import { SkeletonKpis, SkeletonTabla } from "../../components/Skeleton";
import Swal from "sweetalert2";

const FUNDADORES = ["gef.22@hotmail.com"];

function KpiSuperadmin({ etiqueta, valor, color }) {
  const colores = {
    indigo: "bg-indigo-500/10 text-indigo-300 border-indigo-400/20",
    emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-400/20",
    amber: "bg-amber-500/10 text-amber-300 border-amber-400/20",
    cyan: "bg-cyan-500/10 text-cyan-300 border-cyan-400/20"
  };
  return (
    <div className={"rounded-2xl border p-5 " + (colores[color] || colores.indigo)}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{etiqueta}</p>
      <p className="mt-2 text-3xl font-bold">{valor ?? "—"}</p>
    </div>
  );
}

function BadgePlan({ plan }) {
  const colores = {
    free: "bg-slate-700 text-slate-300",
    starter: "bg-blue-500/15 text-blue-300",
    pro: "bg-indigo-500/15 text-indigo-300",
    business: "bg-emerald-500/15 text-emerald-300"
  };
  return (
    <span className={"rounded-full px-2 py-0.5 text-[10px] font-semibold " + (colores[plan] || colores.free)}>
      {plan || "business"}
    </span>
  );
}

function formatFecha(fecha) {
  return new Date(fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function SuperadminPage() {
  const { t } = useTranslation();
  const usuario = useAuthStore((s) => s.usuario);
  const esFundador = FUNDADORES.includes(usuario?.email?.toLowerCase());
  const { data: metricas, isLoading: cargandoMetricas } = useMetricasSuperadmin();
  const { data: empresas, isLoading: cargandoEmpresas } = useEmpresasSuperadmin();
  const toggleEmpresa = useToggleEmpresa();
  const eliminarEmpresa = useEliminarEmpresa();

  if (!esFundador) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-500">Acceso restringido.</p>
      </div>
    );
  }

  async function manejarToggle(empresa) {
    const accion = empresa.activa ? "desactivar" : "activar";
    const { isConfirmed } = await Swal.fire({
      title: t("superadmin.accionEmpresa", { accion: accion.charAt(0).toUpperCase() + accion.slice(1) }),
      text: 'Vas a ' + accion + ' "' + empresa.nombre + '".',
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, " + accion,
      cancelButtonText: "Cancelar"
    });
    if (!isConfirmed) return;
    try {
      await toggleEmpresa.mutateAsync(empresa._id);
      Swal.fire({ icon: "success", title: empresa.activa ? t("superadmin.desactivada") : t("superadmin.activada"), timer: 1500, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: e.message });
    }
  }

  async function manejarEliminar(empresa) {
    const { isConfirmed: paso1 } = await Swal.fire({
      title: t("superadmin.eliminarTitulo"),
      html: t("superadmin.eliminarHtml", { nombre: empresa.nombre }),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar todo",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626"
    });
    if (!paso1) return;
    const { value: confirmacion } = await Swal.fire({
      title: t("superadmin.confirmacionFinal"),
      text: 'Escribí el nombre exacto de la empresa para confirmar:',
      input: "text",
      inputPlaceholder: empresa.nombre,
      showCancelButton: true,
      confirmButtonText: "Eliminar definitivamente",
      confirmButtonColor: "#dc2626"
    });
    if (confirmacion !== empresa.nombre) {
      Swal.fire({ icon: "error", title: t("superadmin.nombreIncorrecto"), text: t("superadmin.noEliminada") });
      return;
    }
    try {
      await eliminarEmpresa.mutateAsync(empresa._id);
      Swal.fire({ icon: "success", title: t("superadmin.empresaEliminada"), text: t("superadmin.fueEliminada", { nombre: empresa.nombre }), timer: 2000, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: e.message });
    }
  }

  return (
    <div className="space-y-8 animate-rise">
      <div>
        <h1 className="text-lg font-bold text-white">Panel de fundador</h1>
        <p className="text-sm text-slate-400">Métricas globales de toda la plataforma.</p>
      </div>

      {cargandoMetricas ? <SkeletonKpis /> : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
          <KpiSuperadmin etiqueta="Empresas" valor={metricas?.empresas} color="indigo" />
          <KpiSuperadmin etiqueta="Usuarios" valor={metricas?.usuarios} color="cyan" />
          <KpiSuperadmin etiqueta="Productos" valor={metricas?.productos} color="emerald" />
          <KpiSuperadmin etiqueta="Sucursales" valor={metricas?.sucursales} color="amber" />
          <KpiSuperadmin etiqueta="Empresas esta semana" valor={metricas?.empresasNuevas} color="indigo" />
          <KpiSuperadmin etiqueta="Usuarios esta semana" valor={metricas?.usuariosNuevos} color="cyan" />
        </div>
      )}

      <div>
        <h2 className="mb-4 text-sm font-semibold text-white">Todas las empresas</h2>
        {cargandoEmpresas ? <SkeletonTabla filas={5} /> : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Empresa</th>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3 text-center">Plan</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-center">Usuarios</th>
                  <th className="px-4 py-3 text-center">Sucursales</th>
                  <th className="px-4 py-3 text-center">Productos</th>
                  <th className="px-4 py-3">Registrada</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {(empresas || []).map((e) => (
                  <tr key={e._id} className="bg-slate-950/50 hover:bg-slate-900/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-white">{e.nombre}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{e.codigoAcceso}</td>
                    <td className="px-4 py-3 text-center"><BadgePlan plan={e.plan} /></td>
                    <td className="px-4 py-3 text-center">
                      <span className={"rounded-full px-2 py-0.5 text-[10px] font-semibold " + (e.activa ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400")}>
                        {e.activa ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-300">{e.usuarios}</td>
                    <td className="px-4 py-3 text-center text-slate-300">{e.sucursales}</td>
                    <td className="px-4 py-3 text-center text-slate-300">{e.productos}</td>
                    <td className="px-4 py-3 text-slate-400">{formatFecha(e.creadaEl)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => manejarToggle(e)}
                          disabled={toggleEmpresa.isPending}
                          className={"rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors " + (e.activa ? "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25" : "bg-green-500/15 text-green-400 hover:bg-green-500/25")}
                        >
                          {e.activa ? "Desactivar" : "Activar"}
                        </button>
                        <button
                          onClick={() => manejarEliminar(e)}
                          disabled={eliminarEmpresa.isPending}
                          className="rounded-lg bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-400 transition-colors hover:bg-red-500/20"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
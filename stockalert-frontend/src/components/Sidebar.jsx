import { NavLink } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const iconos = {
  dashboard: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  productos: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </svg>
  ),
  movimientos: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  sucursales: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  usuarios: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
};

function ItemNav({ to, icono, label, soloAdmin, esAdmin, onNavegar }) {
  if (soloAdmin && !esAdmin) return null;
  return (
    <NavLink
      to={to}
      end={to === "/"}
      onClick={onNavegar}
      className={({ isActive }) =>
        `relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-all duration-200 ${
          isActive
            ? "bg-brand/10 text-indigo-300 before:absolute before:-left-[14px] before:top-1/2 before:h-[18px] before:w-[3px] before:-translate-y-1/2 before:rounded-r before:bg-brand"
            : "text-slate-400 hover:bg-panel hover:text-white"
        }`
      }
    >
      {icono}
      {label}
    </NavLink>
  );
}

export default function Sidebar({ abierto, onCerrar }) {
  const usuario = useAuthStore((s) => s.usuario);
  const cerrarSesion = useAuthStore((s) => s.cerrarSesion);
  const esAdmin = usuario?.rol === "admin";

  return (
    <>
      {/* Fondo oscuro detrás del sidebar (solo visible en móvil cuando está abierto) */}
      {abierto && (
        <div
          onClick={onCerrar}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`fixed z-40 flex h-screen w-[248px] flex-col border-r border-border-soft bg-base p-[14px] transition-transform duration-300 md:static md:z-auto md:translate-x-0 ${
          abierto ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${!abierto ? "md:hidden" : ""}`}
      >
        <div className="flex items-center gap-2.5 px-2 pb-6 pt-1">
          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg shadow-brand/30">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </div>
          <div>
            <p className="text-[15px] font-extrabold text-white">StockAlert</p>
            <p className="text-[10px] font-medium tracking-wide text-slate-600">v5.0 · Inventario</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-[3px]">
          <p className="px-2.5 pb-1.5 pt-3.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">Principal</p>
          <ItemNav to="/" icono={iconos.dashboard} label="Dashboard" soloAdmin esAdmin={esAdmin} onNavegar={onCerrar} />
          <ItemNav to="/productos" icono={iconos.productos} label="Productos" esAdmin={esAdmin} onNavegar={onCerrar} />

          {esAdmin && (
            <>
              <p className="px-2.5 pb-1.5 pt-3.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">Análisis</p>
              <ItemNav to="/movimientos" icono={iconos.movimientos} label="Movimientos" soloAdmin esAdmin={esAdmin} onNavegar={onCerrar} />
              <ItemNav to="/sucursales" icono={iconos.sucursales} label="Sucursales" soloAdmin esAdmin={esAdmin} onNavegar={onCerrar} />
              <ItemNav to="/usuarios" icono={iconos.usuarios} label="Usuarios" soloAdmin esAdmin={esAdmin} onNavegar={onCerrar} />
            </>
          )}
        </nav>

        <div className="flex items-center gap-2.5 rounded-xl border border-border-soft bg-panel p-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-[13px] font-bold text-white">
            {usuario?.nombre?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-semibold text-white">{usuario?.nombre}</p>
            <p className="text-[10.5px] text-slate-600">{esAdmin ? "Administrador" : "Jefe de sucursal"}</p>
          </div>
          <button onClick={cerrarSesion} title="Cerrar sesión" className="text-slate-600 transition-colors hover:text-red-400">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>
    </>
  );
}
import { NavLink } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const iconos = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  productos: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </svg>
  ),
  movimientos: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  sucursales: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  usuarios: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
};

function ItemNav({ to, icono, label, soloAdmin, esAdmin }) {
  if (soloAdmin && !esAdmin) return null;
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive ? "bg-brand/15 text-brand" : "text-slate-400 hover:bg-slate-800 hover:text-white"
        }`
      }
    >
      {icono}
      {label}
    </NavLink>
  );
}

export default function Sidebar({ abierto }) {
  const usuario = useAuthStore((s) => s.usuario);
  const cerrarSesion = useAuthStore((s) => s.cerrarSesion);
  const esAdmin = usuario?.rol === "admin";

  if (!abierto) return null;

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-800 bg-slate-950 p-4">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-white">StockAlert</p>
          <p className="text-[10px] text-slate-500">v5.0</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        <ItemNav to="/" icono={iconos.dashboard} label="Dashboard" soloAdmin esAdmin={esAdmin} />
        <ItemNav to="/productos" icono={iconos.productos} label="Productos" esAdmin={esAdmin} />
        <ItemNav to="/movimientos" icono={iconos.movimientos} label="Movimientos" soloAdmin esAdmin={esAdmin} />
        <ItemNav to="/sucursales" icono={iconos.sucursales} label="Sucursales" soloAdmin esAdmin={esAdmin} />
        <ItemNav to="/usuarios" icono={iconos.usuarios} label="Usuarios" soloAdmin esAdmin={esAdmin} />
      </nav>

      <div className="border-t border-slate-800 pt-3">
        <div className="flex items-center gap-2 rounded-lg bg-slate-900 p-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
            {usuario?.nombre?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">{usuario?.nombre}</p>
            <p className="text-[10px] text-slate-500">{esAdmin ? "Administrador" : "Jefe de sucursal"}</p>
          </div>
          <button onClick={cerrarSesion} title="Cerrar sesión" className="text-slate-500 hover:text-red-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
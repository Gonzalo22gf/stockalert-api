import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Zap, ChevronDown, Package, LayoutDashboard, ClipboardList, Store, Users, TrendingUp, Home, Calendar, Menu } from "lucide-react";

export default function Topbar({ titulo, subtitulo, onToggleSidebar }) {
  const usuario = useAuthStore((s) => s.usuario);
  const navigate = useNavigate();
  const esAdmin = usuario?.rol === "admin";
  const [menuAbierto, setMenuAbierto] = useState(false);
  const fecha = new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const nombreSucursal = esAdmin ? "Todas las sucursales" : usuario?.sucursal?.nombre || "Mi sucursal";

  const accesos = [
    { label: "Productos", icono: Package, ruta: "/productos" },
    { label: "Dashboard", icono: LayoutDashboard, ruta: "/", soloAdmin: true },
    { label: "Movimientos", icono: ClipboardList, ruta: "/movimientos", soloAdmin: true },
    { label: "Sucursales", icono: Store, ruta: "/sucursales", soloAdmin: true },
    { label: "Usuarios", icono: Users, ruta: "/usuarios", soloAdmin: true },
    { label: "Reportes", icono: TrendingUp, ruta: "/reportes", soloAdmin: true }
  ];

  function ir(ruta) {
    setMenuAbierto(false);
    navigate(ruta);
  }

  const chipClase =
    "hidden lg:flex items-center gap-1.5 rounded-[9px] border border-border bg-panel px-3 py-[7px] text-[12.5px] font-medium text-slate-400 transition-all hover:bg-panel-hover hover:border-slate-700";

  return (
    <header className="relative flex items-center justify-between gap-2 border-b border-border-soft bg-base/80 px-4 py-3 backdrop-blur-xl md:px-7 md:py-4">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onToggleSidebar}
          title="Mostrar/ocultar menú"
          className="shrink-0 rounded-lg border border-border bg-panel p-2 text-slate-400 transition-all hover:bg-panel-hover hover:text-white"
        >
          <Menu size={18} />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold text-white md:text-[19px]">{titulo}</h1>
          {subtitulo && <p className="hidden truncate text-[12.5px] text-slate-600 sm:block">{subtitulo}</p>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 md:gap-2.5">
        <div className="relative">
          <button
            onClick={() => setMenuAbierto((v) => !v)}
            className="flex items-center gap-1.5 rounded-[9px] border border-brand/25 bg-brand/10 px-3 py-[7px] text-[12.5px] font-semibold text-brand-400 transition-all hover:bg-brand/20"
          >
            <Zap size={14} /> <span className="hidden sm:inline">Accesos rápidos</span>
            <ChevronDown size={12} />
          </button>
          {menuAbierto && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuAbierto(false)} />
              <div className="absolute right-0 z-20 mt-2 w-48 animate-pop overflow-hidden rounded-xl border border-[#2a2e3a] shadow-2xl shadow-black/60" style={{ backgroundColor: "#13151c" }}>
                {accesos
                  .filter((a) => !a.soloAdmin || esAdmin)
                  .map((a) => {
                    const Icono = a.icono;
                    return (
                      <button
                        key={a.ruta}
                        onClick={() => ir(a.ruta)}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] font-medium transition-colors hover:bg-[#1a1d26]"
                        style={{ color: "#cbd1e0" }}
                      >
                        <Icono size={15} className="shrink-0 text-slate-500" />
                        {a.label}
                      </button>
                    );
                  })}
              </div>
            </>
          )}
        </div>
        <div className={chipClase}>
          <Home size={12} />
          {nombreSucursal}
        </div>
        <div className={chipClase}>
          <Calendar size={12} />
          {fecha}
        </div>
      </div>
    </header>
  );
}

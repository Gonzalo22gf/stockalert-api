import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function Topbar({ titulo, subtitulo, onToggleSidebar }) {
  const usuario = useAuthStore((s) => s.usuario);
  const navigate = useNavigate();
  const esAdmin = usuario?.rol === "admin";
  const [menuAbierto, setMenuAbierto] = useState(false);

  const fecha = new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const nombreSucursal = esAdmin ? "Todas las sucursales" : usuario?.sucursal?.nombre || "Mi sucursal";

  const accesos = [
    { label: "📦 Productos", ruta: "/productos" },
    { label: "📊 Dashboard", ruta: "/", soloAdmin: true },
    { label: "📋 Movimientos", ruta: "/movimientos", soloAdmin: true },
    { label: "🏪 Sucursales", ruta: "/sucursales", soloAdmin: true },
    { label: "👥 Usuarios", ruta: "/usuarios", soloAdmin: true }
  ];

  function ir(ruta) {
    setMenuAbierto(false);
    navigate(ruta);
  }

  // Estos chips (sucursal y fecha) se ocultan en pantallas chicas y solo aparecen en lg+
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
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
            ⚡ <span className="hidden sm:inline">Accesos rápidos</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {menuAbierto && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuAbierto(false)} />
              <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-[#2a2e3a] shadow-2xl shadow-black/60 animate-fade" style={{ backgroundColor: "#13151c" }}>
                {accesos
                  .filter((a) => !a.soloAdmin || esAdmin)
                  .map((a) => (
                    <button
                      key={a.ruta}
                      onClick={() => ir(a.ruta)}
                      className="block w-full px-4 py-2.5 text-left text-[13px] font-medium transition-colors hover:bg-[#1a1d26]"
                      style={{ color: "#cbd1e0" }}
                    >
                      {a.label}
                    </button>
                  ))}
              </div>
            </>
          )}
        </div>

        <div className={chipClase}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </svg>
          {nombreSucursal}
        </div>
        <div className={chipClase}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {fecha}
        </div>
      </div>
    </header>
  );
}

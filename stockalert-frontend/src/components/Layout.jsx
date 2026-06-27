import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import FabEscaner from "./FabEscaner";

const TITULOS = {
  "/": { titulo: "Dashboard", subtitulo: "Resumen general del inventario" },
  "/productos": { titulo: "Productos", subtitulo: "Gestión de inventario" },
  "/movimientos": { titulo: "Movimientos", subtitulo: "Historial de auditoría" },
  "/sucursales": { titulo: "Sucursales", subtitulo: "Administración de sucursales" },
  "/usuarios": { titulo: "Usuarios", subtitulo: "Gestión de usuarios" }
};

export default function Layout() {
  const location = useLocation();
  const { titulo, subtitulo } = TITULOS[location.pathname] || { titulo: "StockAlert", subtitulo: "" };

  const [sidebarAbierto, setSidebarAbierto] = useState(() => window.innerWidth >= 768);

  useEffect(() => {
    const alCambiarTamano = () => {
      setSidebarAbierto(window.innerWidth >= 768);
    };
    window.addEventListener("resize", alCambiarTamano);
    return () => window.removeEventListener("resize", alCambiarTamano);
  }, []);

  return (
    <div className="flex h-screen bg-base">
      <Sidebar abierto={sidebarAbierto} onCerrar={() => setSidebarAbierto(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar titulo={titulo} subtitulo={subtitulo} onToggleSidebar={() => setSidebarAbierto((v) => !v)} />
        <main className="flex-1 overflow-y-auto px-4 py-5 md:px-7 md:py-6">
          <Outlet />
        </main>
      </div>
      <FabEscaner />
    </div>
  );
}

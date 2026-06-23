import FabEscaner from "./FabEscaner";
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

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
  const [sidebarAbierto, setSidebarAbierto] = useState(true);

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar abierto={sidebarAbierto} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          titulo={titulo}
          subtitulo={subtitulo}
          onToggleSidebar={() => setSidebarAbierto((v) => !v)}
        />
<main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      <FabEscaner />
    </div>
  );
}
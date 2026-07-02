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
  "/usuarios": { titulo: "Usuarios", subtitulo: "Gestión de usuarios" },
  "/reportes": { titulo: "Reportes", subtitulo: "Histórico y evolución de las tiendas" }
};

export default function Layout() {
  const location = useLocation();
  const { titulo, subtitulo } = TITULOS[location.pathname] || { titulo: "StockAlert", subtitulo: "" };

  // Estado para móvil: overlay abierto/cerrado
  const [sidebarAbierto, setSidebarAbierto] = useState(() => window.innerWidth >= 768);

  // Estado para escritorio: colapsado (solo íconos) o expandido. Recuerda la preferencia.
  const [sidebarColapsado, setSidebarColapsado] = useState(() => {
    try {
      return localStorage.getItem("sidebarColapsado") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const alCambiarTamano = () => {
      setSidebarAbierto(window.innerWidth >= 768);
    };
    window.addEventListener("resize", alCambiarTamano);
    return () => window.removeEventListener("resize", alCambiarTamano);
  }, []);

  function alternarColapso() {
    setSidebarColapsado((v) => {
      const nuevo = !v;
      try {
        localStorage.setItem("sidebarColapsado", String(nuevo));
      } catch {}
      return nuevo;
    });
  }

  return (
    <div className="flex h-screen bg-base">
      <Sidebar
        abierto={sidebarAbierto}
        colapsado={sidebarColapsado}
        onCerrar={() => setSidebarAbierto(false)}
        onAlternarColapso={alternarColapso}
      />
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

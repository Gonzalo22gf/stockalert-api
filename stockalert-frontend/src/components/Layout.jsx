import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import ModalUpgrade from "./ModalUpgrade";
import FabEscaner from "../features/productos/FabEscaner";
import { useInactividad } from "../hooks/useInactividad";
import { esPlanError } from "../lib/PlanError";

const TITULOS = {
  "/": { titulo: "Dashboard", subtitulo: "Resumen general del inventario" },
  "/productos": { titulo: "Productos", subtitulo: "Gestion de inventario" },
  "/movimientos": { titulo: "Movimientos", subtitulo: "Historial de auditoria" },
  "/sucursales": { titulo: "Sucursales", subtitulo: "Administracion de sucursales" },
  "/usuarios": { titulo: "Usuarios", subtitulo: "Gestion de usuarios" },
  "/reportes": { titulo: "Reportes", subtitulo: "Historico y evolucion de las tiendas" }
};

// Funcion global para disparar el modal de upgrade desde cualquier lugar
export function mostrarUpgrade(codigo) {
  window.dispatchEvent(new CustomEvent("plan-error", { detail: { codigo } }));
}

export default function Layout() {
  useInactividad();
  const location = useLocation();
  const { titulo, subtitulo } = TITULOS[location.pathname] || { titulo: "StockAlert", subtitulo: "" };
  const [sidebarAbierto, setSidebarAbierto] = useState(() => window.innerWidth >= 768);
  const [sidebarColapsado, setSidebarColapsado] = useState(() => {
    try { return localStorage.getItem("sidebarColapsado") === "true"; } catch { return false; }
  });
  const [upgradeInfo, setUpgradeInfo] = useState(null);

  useEffect(() => {
    const alCambiarTamano = () => setSidebarAbierto(window.innerWidth >= 768);
    window.addEventListener("resize", alCambiarTamano);
    return () => window.removeEventListener("resize", alCambiarTamano);
  }, []);

  // Escuchar eventos de plan-error desde cualquier componente
  useEffect(() => {
    function onPlanError(e) { setUpgradeInfo(e.detail); }
    window.addEventListener("plan-error", onPlanError);
    return () => window.removeEventListener("plan-error", onPlanError);
  }, []);

  function alternarColapso() {
    setSidebarColapsado((v) => {
      const nuevo = !v;
      try { localStorage.setItem("sidebarColapsado", String(nuevo)); } catch {}
      return nuevo;
    });
  }

  return (
    <div className="flex h-dvh bg-base">
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
      {upgradeInfo && (
        <ModalUpgrade codigo={upgradeInfo.codigo} onCerrar={() => setUpgradeInfo(null)} />
      )}
    </div>
  );
}
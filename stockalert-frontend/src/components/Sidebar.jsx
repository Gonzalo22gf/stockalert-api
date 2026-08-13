import { useRef, useState, useLayoutEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../features/auth/authStore";
import SelectorIdioma from "./SelectorIdioma";
import { usePush } from "../hooks/usePush";
import { Bell, BellOff } from "lucide-react";
import {
  LayoutDashboard, Package, Activity, Store, Users, TrendingUp, Link, KeyRound, ShieldCheck, CreditCard,
  ChevronRight, ChevronLeft, LogOut, BoxesIcon
} from "lucide-react";

function ItemNav({ to, Icono, label, soloAdmin, esAdmin, onNavegar, colapsado }) {
  if (soloAdmin && !esAdmin) return null;
  return (
    <NavLink
      to={to}
      end={to === "/"}
      onClick={onNavegar}
      title={colapsado ? label : undefined}
      className={({ isActive }) =>
        `nav-item relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-all duration-200 ${
          colapsado ? "justify-center" : ""
        } ${
          isActive
            ? "is-active bg-brand/10 text-brand-400"
            : "text-slate-400 hover:bg-panel hover:text-white"
        }`
      }
    >
      <Icono size={17} strokeWidth={1.8} />
      {!colapsado && label}
    </NavLink>
  );
}

export default function Sidebar({ abierto, colapsado, onCerrar, onAlternarColapso }) {
  const { t } = useTranslation();
  const location = useLocation();
  const usuario = useAuthStore((s) => s.usuario);
  const cerrarSesion = useAuthStore((s) => s.cerrarSesion);
  const esAdmin = usuario?.rol === "admin";
  const { activado, cargando, activar, desactivar } = usePush();
  const esFundador = ["gef.22@hotmail.com"].includes(usuario?.email?.toLowerCase());
  const anchoSidebar = colapsado ? "md:w-[72px]" : "md:w-[248px]";

  const navRef = useRef(null);
  const [indicador, setIndicador] = useState({ top: 0, alto: 0, visible: false });

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const activo = nav.querySelector(".nav-item.is-active");
    if (activo) {
      setIndicador({ top: activo.offsetTop, alto: activo.offsetHeight, visible: true });
    } else {
      setIndicador((prev) => ({ ...prev, visible: false }));
    }
  }, [location.pathname, colapsado, esAdmin, esFundador]);

  return (
    <>
      {abierto && (
        <div onClick={onCerrar} className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden" />
      )}
      <aside
        className={`fixed z-40 flex h-dvh w-[248px] flex-col overflow-y-auto border-r border-border-soft bg-base p-[14px] transition-all duration-300 md:static md:z-auto md:translate-x-0 ${anchoSidebar} ${
          abierto ? "translate-x-0" : "max-md:-translate-x-full"
        }`}
      >
        <div className={`flex items-center gap-2.5 px-2 pb-6 pt-1 ${colapsado ? "md:justify-center md:px-0" : ""}`}>
          <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg shadow-brand/30">
            <BoxesIcon size={18} strokeWidth={2} stroke="white" />
          </div>
          {!colapsado && (
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-extrabold text-white">StockAlert</p>
              <p className="text-[10px] font-medium tracking-wide text-slate-600">v5.0 · Inventario</p>
            </div>
          )}
          <button
            onClick={onAlternarColapso}
            title={colapsado ? t("nav.expandir") : t("nav.colapsar")}
            className={`shrink-0 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-panel hover:text-white ${colapsado ? "hidden" : "hidden md:block"}`}
          >
            {colapsado ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav ref={navRef} className="relative flex flex-1 flex-col gap-[3px]">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -left-[14px] w-[3px] rounded-r bg-brand transition-all duration-300 ease-out"
            style={{ top: indicador.top, height: indicador.alto, opacity: indicador.visible ? 1 : 0 }}
          />
          {!colapsado && <p className="px-2.5 pb-1.5 pt-3.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">{t("nav.principal")}</p>}
          <ItemNav to="/" Icono={LayoutDashboard} label={t("nav.dashboard")} onNavegar={onCerrar} colapsado={colapsado} />
          <ItemNav to="/productos" Icono={Package} label={t("nav.productos")} esAdmin={esAdmin} onNavegar={onCerrar} colapsado={colapsado} />
          {esFundador && <ItemNav to="/superadmin" Icono={ShieldCheck} label="Superadmin" onNavegar={onCerrar} colapsado={colapsado} />}
          {esAdmin && (
            <>
              {!colapsado && <p className="px-2.5 pb-1.5 pt-3.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">{t("nav.analisis")}</p>}
              <ItemNav to="/movimientos" Icono={Activity} label={t("nav.movimientos")} soloAdmin esAdmin={esAdmin} onNavegar={onCerrar} colapsado={colapsado} />
              <ItemNav to="/sucursales" Icono={Store} label={t("nav.sucursales")} soloAdmin esAdmin={esAdmin} onNavegar={onCerrar} colapsado={colapsado} />
              <ItemNav to="/usuarios" Icono={Users} label={t("nav.usuarios")} soloAdmin esAdmin={esAdmin} onNavegar={onCerrar} colapsado={colapsado} />
              <ItemNav to="/reportes" Icono={TrendingUp} label={t("nav.reportes")} soloAdmin esAdmin={esAdmin} onNavegar={onCerrar} colapsado={colapsado} />
              <ItemNav to="/links" Icono={Link} label={t("nav.links")} onNavegar={onCerrar} colapsado={colapsado} />
              {esAdmin && <ItemNav to="/planes" Icono={CreditCard} label="Planes" onNavegar={onCerrar} colapsado={colapsado} />}
              <ItemNav to="/codigo-acceso" Icono={KeyRound} label={t("nav.codigoAcceso")} soloAdmin esAdmin={esAdmin} onNavegar={onCerrar} colapsado={colapsado} />
            </>
          )}
        </nav>

        <div className="mt-2">
          <button
            onClick={activado ? desactivar : activar}
            disabled={cargando}
            title={activado ? "Desactivar notificaciones" : "Activar notificaciones"}
            className={"flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-[12.5px] font-medium transition-colors " + (activado ? "text-brand-400 hover:bg-base/60" : "text-slate-500 hover:bg-base/60 hover:text-slate-300")}
          >
            {activado ? <Bell size={15} /> : <BellOff size={15} />}
            {!colapsado && (activado ? "Notificaciones ON" : "Notificaciones OFF")}
          </button>
          <SelectorIdioma colapsado={colapsado} />
        </div>

        <div className={`flex items-center gap-2.5 rounded-xl border border-border-soft bg-panel p-2.5 ${colapsado ? "md:justify-center md:p-2" : ""}`}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-[13px] font-bold text-white">
            {usuario?.nombre?.[0]?.toUpperCase() || "U"}
          </div>
          {!colapsado && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold text-white">{usuario?.nombre}</p>
                <p className="text-[10.5px] text-slate-600">{esAdmin ? t("usuarios.admin") : t("usuarios.jefe")}</p>
                {usuario?.empresa?.nombre && <p className="truncate text-[10px] text-slate-700">{usuario.empresa.nombre}</p>}
              </div>
              <button onClick={cerrarSesion} title={t("nav.cerrarSesion")} className="text-slate-600 transition-colors hover:text-red-400">
                <LogOut size={15} strokeWidth={2.2} />
              </button>
            </>
          )}
        </div>
        {colapsado && (
          <button
            onClick={cerrarSesion}
            title={t("nav.cerrarSesion")}
            className="mt-2 hidden items-center justify-center rounded-lg p-2 text-slate-500 transition-colors hover:bg-panel hover:text-red-400 md:flex"
          >
            <LogOut size={16} strokeWidth={2.2} />
          </button>
        )}
      </aside>
    </>
  );
}

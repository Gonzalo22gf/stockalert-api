import EmptyState from "../../components/EmptyState";
import { SkeletonTabla } from "../../components/Skeleton";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { useAuthStore } from "../auth/authStore";
import { useUsuarios, useCambiarRol, useCambiarEstado, useEliminarUsuario } from "./useUsuarios";
import { descargarBackupUsuario } from "../../lib/exportar";
import ModalEditarUsuario from "./ModalEditarUsuario";
import { Input, Select } from "../../components/ui/Input";

function MenuAcciones({ usuario, onEditar, onRol, onEstado, onEliminar, t }) {
  const [abierto, setAbierto] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const item = "block w-full px-4 py-2 text-left text-[13px] font-medium transition-colors hover:bg-[#1a1d26]";
  function alternar(e) {
    if (!abierto) {
      const r = e.currentTarget.getBoundingClientRect();
      let left = r.right - 176;
      let top = r.bottom + 6;
      if (top + 160 > window.innerHeight) top = r.top - 160 - 6;
      if (left < 8) left = 8;
      setPos({ top, left });
    }
    setAbierto((v) => !v);
  }
  return (
    <div className="relative inline-block text-left">
      <button onClick={alternar} className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-slate-300 transition-colors hover:bg-slate-700" title="Acciones">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
        </svg>
      </button>
      {abierto && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setAbierto(false)} />
          <div className="fixed z-20 w-44 animate-pop overflow-hidden rounded-xl border border-[#2a2e3a] shadow-2xl shadow-black/60" style={{ top: pos.top, left: pos.left, backgroundColor: "#13151c" }}>
            <button onClick={() => { setAbierto(false); onEditar(); }} className={item} style={{ color: "#cbd1e0" }}>{t("usuarios.editar")}</button>
            <button onClick={() => { setAbierto(false); onRol(); }} className={item} style={{ color: "#cbd1e0" }}>{t("usuarios.cambiarRol")}</button>
            <button onClick={() => { setAbierto(false); onEstado(); }} className={item} style={{ color: usuario.activo ? "#fb923c" : "#4ade80" }}>{usuario.activo ? t("usuarios.desactivar") : t("usuarios.activar")}</button>
            <button onClick={() => { setAbierto(false); onEliminar(); }} className={item} style={{ color: "#f87171" }}>{t("usuarios.eliminar")}</button>
          </div>
        </>
      )}
    </div>
  );
}

function BadgeRol({ rol, t }) {
  return (
    <span className={"rounded-full px-2 py-0.5 text-[10px] font-medium " + (rol === "admin" ? "bg-brand/15 text-brand" : "bg-slate-700 text-slate-300")}>
      {rol === "admin" ? t("usuarios.admin") : t("usuarios.jefe")}
    </span>
  );
}

function BadgeEstado({ activo, t }) {
  return (
    <span className={"inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium " + (activo ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400")}>
      <span className={"h-1.5 w-1.5 rounded-full " + (activo ? "bg-green-400" : "bg-red-400")} />
      {activo ? t("usuarios.activo") : t("usuarios.inactivo")}
    </span>
  );
}

function Avatar({ nombre }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-[13px] font-bold text-white">
      {nombre?.[0]?.toUpperCase() || "U"}
    </div>
  );
}

export default function UsuariosPage() {
  const { t } = useTranslation();
  const usuarioActual = useAuthStore((s) => s.usuario);
  const esAdmin = usuarioActual?.rol === "admin";
  const { data: usuarios, isLoading, isError } = useUsuarios(esAdmin);
  const cambiarRol = useCambiarRol();
  const cambiarEstado = useCambiarEstado();
  const eliminarUsuario = useEliminarUsuario();
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [filtroZona, setFiltroZona] = useState("");
  const [filtroNumero, setFiltroNumero] = useState("");
  const [busqueda, setBusqueda] = useState("");

  if (!esAdmin) return <Navigate to="/productos" replace />;

  async function manejarCambiarRol(usuario) {
    const nuevoRol = usuario.rol === "admin" ? "jefe" : "admin";
    const resultado = await Swal.fire({
      title: t("usuarios.cambiarRol") + "?",
      text: usuario.nombre + " → \"" + nuevoRol + "\".",
      icon: "question", showCancelButton: true,
      confirmButtonText: t("common.guardar"), cancelButtonText: t("common.cancelar")
    });
    if (!resultado.isConfirmed) return;
    try {
      await cambiarRol.mutateAsync({ id: usuario._id, rol: nuevoRol });
      Swal.fire({ icon: "success", title: t("usuarios.rolActualizado"), timer: 1300, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: "error", title: t("usuarios.error"), text: error.message });
    }
  }

  async function manejarCambiarEstado(usuario) {
    try {
      await cambiarEstado.mutateAsync({ id: usuario._id, activo: !usuario.activo });
      Swal.fire({ icon: "success", title: !usuario.activo ? t("usuarios.activado") : t("usuarios.desactivado"), timer: 1300, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: "error", title: t("usuarios.error"), text: error.message });
    }
  }

  async function manejarEliminar(usuario) {
    const resultado = await Swal.fire({
      title: t("usuarios.confirmEliminar"),
      text: usuario.nombre + " (" + usuario.email + "). " + t("usuarios.noDeshacer"),
      icon: "warning", showCancelButton: true,
      confirmButtonText: t("usuarios.eliminar"), cancelButtonText: t("common.cancelar"), confirmButtonColor: "#dc2626"
    });
    if (!resultado.isConfirmed) return;
    try {
      descargarBackupUsuario(usuario);
      await eliminarUsuario.mutateAsync(usuario._id);
      Swal.fire({ icon: "success", title: t("usuarios.eliminado") });
    } catch (error) {
      Swal.fire({ icon: "error", title: t("usuarios.error"), text: error.message });
    }
  }

  const zonas = [...new Set((usuarios || []).map((u) => u.sucursal?.zona).filter((z) => z !== undefined))].sort((a, b) => a - b);
  const usuariosFiltrados = (usuarios || []).filter((u) => {
    const texto = busqueda.toLowerCase();
    return (u.nombre.toLowerCase().includes(texto) || u.email.toLowerCase().includes(texto)) &&
      (filtroZona ? String(u.sucursal?.zona) === filtroZona : true) &&
      (filtroNumero ? String(u.sucursal?.numero || "").includes(filtroNumero) : true);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Input type="text" placeholder={"🔍 " + t("usuarios.buscar")} value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="flex-1" />
        <Select value={filtroZona} onChange={(e) => setFiltroZona(e.target.value)} className="w-auto">
          <option value="">{t("sucursales.todas")}</option>
          {zonas.map((z) => (<option key={z} value={z}>{t("sucursales.zona")} {z}</option>))}
        </Select>
        <Input type="text" placeholder={t("sucursales.numero") + "..."} value={filtroNumero} onChange={(e) => setFiltroNumero(e.target.value)} className="w-auto" />
      </div>

      {isLoading && <SkeletonTabla filas={5} />}
      {isError && <p className="text-sm text-red-400">{t("usuarios.error")}</p>}
      {!isLoading && !isError && (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-slate-800 md:block">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">{t("usuarios.nombre")}</th>
                  <th className="px-4 py-3 text-center">{t("usuarios.rol")}</th>
                  <th className="px-4 py-3">{t("usuarios.sucursal")}</th>
                  <th className="px-4 py-3 text-center">{t("usuarios.estado")}</th>
                  <th className="px-4 py-3 text-right">{t("common.acciones")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {usuariosFiltrados.map((u) => (
                  <tr key={u._id} className="bg-slate-950/50 transition-colors hover:bg-slate-900/50">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <Avatar nombre={u.nombre} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white">{u.nombre}</p>
                          <p className="truncate text-[12px] text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center"><BadgeRol rol={u.rol} t={t} /></td>
                    <td className="px-4 py-2.5 text-slate-400">{u.sucursal?.nombre || "-"}</td>
                    <td className="px-4 py-2.5 text-center"><BadgeEstado activo={u.activo} t={t} /></td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end">
                        <MenuAcciones t={t} usuario={u} onEditar={() => setUsuarioEditando(u)} onRol={() => manejarCambiarRol(u)} onEstado={() => manejarCambiarEstado(u)} onEliminar={() => manejarEliminar(u)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 md:hidden">
            {usuariosFiltrados.map((u) => (
              <div key={u._id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar nombre={u.nombre} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{u.nombre}</p>
                      <p className="truncate text-[12px] text-slate-500">{u.email}</p>
                    </div>
                  </div>
                  <MenuAcciones t={t} usuario={u} onEditar={() => setUsuarioEditando(u)} onRol={() => manejarCambiarRol(u)} onEstado={() => manejarCambiarEstado(u)} onEliminar={() => manejarEliminar(u)} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-3">
                  <BadgeRol rol={u.rol} t={t} />
                  <BadgeEstado activo={u.activo} t={t} />
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">{u.sucursal?.nombre || t("usuarios.sinSucursal")}</span>
                </div>
              </div>
            ))}
          </div>
          {usuariosFiltrados.length === 0 && <EmptyState icono="👥" titulo={t("usuarios.sinUsuarios")} descripcion="" />}
        </>
      )}
      {usuarioEditando && <ModalEditarUsuario usuario={usuarioEditando} onCerrar={() => setUsuarioEditando(null)} />}
    </div>
  );
}

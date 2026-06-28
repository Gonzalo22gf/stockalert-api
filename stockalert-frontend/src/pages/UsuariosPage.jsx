import EmptyState from "../components/EmptyState";
import { SkeletonTabla } from "../components/Skeleton";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuthStore } from "../store/authStore";
import { useUsuarios, useCambiarRol, useCambiarEstado, useEliminarUsuario } from "../hooks/useUsuarios";
import { descargarBackupUsuario } from "../utils/exportar";
import ModalEditarUsuario from "../components/ModalEditarUsuario";

function MenuAcciones({ usuario, onEditar, onRol, onEstado, onEliminar }) {
  const [abierto, setAbierto] = useState(false);
  const item = "block w-full px-4 py-2 text-left text-[13px] font-medium transition-colors hover:bg-[#1a1d26]";
  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setAbierto((v) => !v)}
        className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-slate-300 transition-colors hover:bg-slate-700"
        title="Acciones"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>
      {abierto && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setAbierto(false)} />
          <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-[#2a2e3a] shadow-2xl shadow-black/60" style={{ backgroundColor: "#13151c" }}>
            <button onClick={() => { setAbierto(false); onEditar(); }} className={item} style={{ color: "#cbd1e0" }}>Editar</button>
            <button onClick={() => { setAbierto(false); onRol(); }} className={item} style={{ color: "#cbd1e0" }}>Cambiar rol</button>
            <button onClick={() => { setAbierto(false); onEstado(); }} className={item} style={{ color: usuario.activo ? "#fb923c" : "#4ade80" }}>{usuario.activo ? "Desactivar" : "Activar"}</button>
            <button onClick={() => { setAbierto(false); onEliminar(); }} className={item} style={{ color: "#f87171" }}>Eliminar</button>
          </div>
        </>
      )}
    </div>
  );
}

function BadgeRol({ rol }) {
  return (
    <span className={"rounded-full px-2 py-0.5 text-[10px] font-medium " + (rol === "admin" ? "bg-brand/15 text-brand" : "bg-slate-700 text-slate-300")}>
      {rol === "admin" ? "Administrador" : "Jefe"}
    </span>
  );
}

function BadgeEstado({ activo }) {
  return (
    <span className={"inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium " + (activo ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400")}>
      <span className={"h-1.5 w-1.5 rounded-full " + (activo ? "bg-green-400" : "bg-red-400")} />
      {activo ? "Activo" : "Inactivo"}
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

  if (!esAdmin) {
    return <Navigate to="/productos" replace />;
  }

  async function manejarCambiarRol(usuario) {
    const nuevoRol = usuario.rol === "admin" ? "jefe" : "admin";
    const resultado = await Swal.fire({
      title: "¿Cambiar rol?",
      text: usuario.nombre + " pasará a ser \"" + nuevoRol + "\".",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, cambiar",
      cancelButtonText: "Cancelar"
    });
    if (!resultado.isConfirmed) return;
    try {
      await cambiarRol.mutateAsync({ id: usuario._id, rol: nuevoRol });
      Swal.fire({ icon: "success", title: "Rol actualizado", timer: 1300, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    }
  }

  async function manejarCambiarEstado(usuario) {
    const nuevoEstado = !usuario.activo;
    try {
      await cambiarEstado.mutateAsync({ id: usuario._id, activo: nuevoEstado });
      Swal.fire({ icon: "success", title: nuevoEstado ? "Usuario activado" : "Usuario desactivado", timer: 1300, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    }
  }

  async function manejarEliminar(usuario) {
    const resultado = await Swal.fire({
      title: "Eliminar usuario",
      text: "Vas a eliminar a " + usuario.nombre + " (" + usuario.email + "). Esta acción no se puede deshacer. Antes se descargará un backup en Excel.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, descargar backup y eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626"
    });
    if (!resultado.isConfirmed) return;
    try {
      descargarBackupUsuario(usuario);
      await eliminarUsuario.mutateAsync(usuario._id);
      Swal.fire({ icon: "success", title: "Usuario eliminado", text: "Se eliminó \"" + usuario.nombre + "\". El backup quedó descargado." });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    }
  }

  const zonas = [...new Set((usuarios || []).map((u) => u.sucursal?.zona).filter((z) => z !== undefined))].sort((a, b) => a - b);

  const usuariosFiltrados = (usuarios || []).filter((u) => {
    const texto = busqueda.toLowerCase();
    const coincideBusqueda = u.nombre.toLowerCase().includes(texto) || u.email.toLowerCase().includes(texto);
    const coincideZona = filtroZona ? String(u.sucursal?.zona) === filtroZona : true;
    const coincideNumero = filtroNumero ? String(u.sucursal?.numero || "").includes(filtroNumero) : true;
    return coincideBusqueda && coincideZona && coincideNumero;
  });

  const inputClase = "rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand focus:outline-none";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <input type="text" placeholder="Buscar por nombre o email..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className={"flex-1 " + inputClase} />
        <select value={filtroZona} onChange={(e) => setFiltroZona(e.target.value)} className={inputClase}>
          <option value="">Todas las zonas</option>
          {zonas.map((z) => (<option key={z} value={z}>Zona {z}</option>))}
        </select>
        <input type="text" placeholder="N° de tienda..." value={filtroNumero} onChange={(e) => setFiltroNumero(e.target.value)} className={inputClase} />
      </div>

      {isLoading && <SkeletonTabla filas={5} />}
      {isError && <p className="text-sm text-red-400">No se pudieron cargar los usuarios.</p>}

      {!isLoading && !isError && (
        <>
          {/* TABLA - solo escritorio (md y mayores) */}
          <div className="hidden overflow-x-auto rounded-xl border border-slate-800 md:block">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3 text-center">Rol</th>
                  <th className="px-4 py-3">Sucursal</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
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
                    <td className="px-4 py-2.5 text-center"><BadgeRol rol={u.rol} /></td>
                    <td className="px-4 py-2.5 text-slate-400">{u.sucursal?.nombre || "-"}</td>
                    <td className="px-4 py-2.5 text-center"><BadgeEstado activo={u.activo} /></td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end">
                        <MenuAcciones usuario={u} onEditar={() => setUsuarioEditando(u)} onRol={() => manejarCambiarRol(u)} onEstado={() => manejarCambiarEstado(u)} onEliminar={() => manejarEliminar(u)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TARJETAS - solo móvil (menores de md) */}
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
                  <MenuAcciones usuario={u} onEditar={() => setUsuarioEditando(u)} onRol={() => manejarCambiarRol(u)} onEstado={() => manejarCambiarEstado(u)} onEliminar={() => manejarEliminar(u)} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-3">
                  <BadgeRol rol={u.rol} />
                  <BadgeEstado activo={u.activo} />
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                    {u.sucursal?.nombre || "Sin sucursal"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {usuariosFiltrados.length === 0 && (
            <EmptyState icono="👥" titulo="No hay usuarios" descripcion="Probá ajustar los filtros de búsqueda." />
          )}
        </>
      )}

      {usuarioEditando && <ModalEditarUsuario usuario={usuarioEditando} onCerrar={() => setUsuarioEditando(null)} />}
    </div>
  );
}

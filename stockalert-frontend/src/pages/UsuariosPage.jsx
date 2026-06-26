import EmptyState from "../components/EmptyState";
import { SkeletonTabla } from "../components/Skeleton";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuthStore } from "../store/authStore";
import { useUsuarios, useCambiarRol, useCambiarEstado, useEliminarUsuario } from "../hooks/useUsuarios";
import { descargarBackupUsuario } from "../utils/exportar";
import ModalEditarUsuario from "../components/ModalEditarUsuario";

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
      text: `${usuario.nombre} pasará a ser "${nuevoRol}".`,
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
      title: "⚠️ Eliminar usuario",
      html: `
        <div style="text-align:left;font-size:14px">
          Vas a eliminar al usuario <b>${usuario.nombre}</b> (${usuario.email}).<br><br>
          <span style="color:#f87171">Esta acción <b>no se puede deshacer</b>.</span><br><br>
          Antes de borrar se descargará un <b>backup en Excel</b> con sus datos.
        </div>
      `,
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

      Swal.fire({
        icon: "success",
        title: "Usuario eliminado",
        text: `Se eliminó "${usuario.nombre}". El backup quedó descargado.`
      });
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

  const inputClase =
    "rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand focus:outline-none";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="🔍 Buscar por nombre o email..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className={`flex-1 ${inputClase}`}
        />
        <select value={filtroZona} onChange={(e) => setFiltroZona(e.target.value)} className={inputClase}>
          <option value="">Todas las zonas</option>
          {zonas.map((z) => (
            <option key={z} value={z}>
              Zona {z}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="N° de tienda..."
          value={filtroNumero}
          onChange={(e) => setFiltroNumero(e.target.value)}
          className={inputClase}
        />
      </div>

      {isLoading && <SkeletonTabla filas={5} />}
      {isError && <p className="text-sm text-red-400">No se pudieron cargar los usuarios.</p>}

      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3 text-center">Rol</th>
                <th className="px-4 py-3 text-center">Sucursal</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {usuariosFiltrados.map((u) => (
                <tr key={u._id} className="bg-slate-950/50">
                  <td className="px-4 py-3 font-semibold text-white">{u.nombre}</td>
                  <td className="px-4 py-3 text-slate-400">{u.email}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${u.rol === "admin" ? "bg-brand/15 text-brand" : "bg-slate-700 text-slate-300"}`}>
                      {u.rol === "admin" ? "Administrador" : "Jefe"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-400">{u.sucursal?.nombre || "-"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${u.activo ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setUsuarioEditando(u)}
                        className="rounded-lg bg-brand/15 px-2.5 py-1 text-xs font-semibold text-brand hover:bg-brand/25"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => manejarCambiarRol(u)}
                        className="rounded-lg bg-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-600"
                      >
                        Rol
                      </button>
                      <button
                        onClick={() => manejarCambiarEstado(u)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${u.activo ? "bg-orange-500/15 text-orange-400 hover:bg-orange-500/25" : "bg-green-500/15 text-green-400 hover:bg-green-500/25"}`}
                      >
                        {u.activo ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        onClick={() => manejarEliminar(u)}
                        className="rounded-lg bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/25"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {usuariosFiltrados.length === 0 && (
            <EmptyState icono="👥" titulo="No hay usuarios" descripcion="Probá ajustar los filtros de búsqueda." />
          )}
        </div>
      )}

      {usuarioEditando && <ModalEditarUsuario usuario={usuarioEditando} onCerrar={() => setUsuarioEditando(null)} />}
    </div>
  );
}
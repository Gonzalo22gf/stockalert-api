import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useEditarUsuario } from "../hooks/useUsuarios";
import PasswordInput from "./PasswordInput";

export default function ModalEditarUsuario({ usuario, onCerrar }) {
  const editarUsuario = useEditarUsuario();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (usuario) {
      setNombre(usuario.nombre || "");
      setEmail(usuario.email || "");
      setPassword("");
    }
  }, [usuario]);

  if (!usuario) return null;

  async function manejarGuardar(e) {
    e.preventDefault();

    if (!nombre || !email) {
      Swal.fire({ icon: "warning", title: "Datos incompletos", text: "Nombre y email son obligatorios." });
      return;
    }

    const datos = { nombre: nombre.trim(), email: email.trim() };
    if (password.trim()) {
      datos.password = password.trim();
    }

    try {
      await editarUsuario.mutateAsync({ id: usuario._id, datos });
      Swal.fire({ icon: "success", title: "Usuario actualizado", timer: 1400, showConfirmButton: false });
      onCerrar();
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    }
  }

  const inputClase =
    "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onCerrar}>
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-base font-bold text-white">Editar usuario</h2>

        <form onSubmit={manejarGuardar} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Nombre</label>
            <input className={inputClase} value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Email</label>
            <input className={inputClase} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Nueva contraseña (dejar vacío para no cambiar)</label>
            <PasswordInput id="editUserPassword" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={editarUsuario.isPending}
              className="flex-1 rounded-lg bg-brand py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {editarUsuario.isPending ? "Guardando..." : "Guardar cambios"}
            </button>
            <button
              type="button"
              onClick={onCerrar}
              className="flex-1 rounded-lg border border-slate-700 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
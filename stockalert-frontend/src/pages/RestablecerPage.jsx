import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import Swal from "sweetalert2";
import { restablecerPassword } from "../api/auth";
import PasswordInput from "../components/PasswordInput";
import Boton from "../components/ui/Boton";

export default function RestablecerPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [cargando, setCargando] = useState(false);

  async function manejarSubmit(e) {
    e.preventDefault();
    if (password.length < 8) {
      Swal.fire({ icon: "warning", title: "Contraseña muy corta", text: "Debe tener al menos 8 caracteres, e incluir mayúscula, número y símbolo." });
      return;
    }
    if (password !== confirmar) {
      Swal.fire({ icon: "warning", title: "No coinciden", text: "Las contraseñas ingresadas no son iguales." });
      return;
    }
    setCargando(true);
    try {
      const respuesta = await restablecerPassword(token, password);
      await Swal.fire({ icon: "success", title: "¡Listo!", text: respuesta.mensaje || "Contraseña restablecida." });
      navigate("/login");
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">Nueva contraseña</h1>
          <p className="text-sm text-slate-400">Elegí tu nueva contraseña de StockAlert</p>
        </div>

        {!token ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-red-400">El link no es válido o está incompleto.</p>
            <Link to="/login" className="text-sm font-semibold text-brand-400 hover:underline">
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={manejarSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Nueva contraseña</label>
              <PasswordInput id="nuevaPassword" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Repetir contraseña</label>
              <PasswordInput id="confirmarPassword" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} required />
            </div>
            <Boton type="submit" disabled={cargando} className="w-full">
              {cargando ? "Guardando..." : "Guardar nueva contraseña"}
            </Boton>
            <div className="text-center">
              <Link to="/login" className="text-xs text-slate-500 hover:text-slate-300">
                Volver al inicio de sesión
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

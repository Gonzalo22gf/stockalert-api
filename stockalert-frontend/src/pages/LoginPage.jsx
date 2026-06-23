import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { login, registrar } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import PasswordInput from "../components/PasswordInput";

export default function LoginPage() {
  const navigate = useNavigate();
  const guardarSesion = useAuthStore((s) => s.guardarSesion);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [cargandoLogin, setCargandoLogin] = useState(false);

  const [regNombre, setRegNombre] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regSucursal, setRegSucursal] = useState("");
  const [cargandoRegistro, setCargandoRegistro] = useState(false);

  async function manejarLogin(e) {
    e.preventDefault();
    setCargandoLogin(true);
    try {
      const data = await login(loginEmail.trim(), loginPassword.trim());
      guardarSesion(data);
      Swal.fire({ icon: "success", title: "Bienvenido", text: `Ingresaste como ${data.nombre}`, timer: 1600, showConfirmButton: false });
      navigate("/");
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    } finally {
      setCargandoLogin(false);
    }
  }

  async function manejarRegistro(e) {
    e.preventDefault();
    setCargandoRegistro(true);
    try {
      const data = await registrar(regNombre.trim(), regEmail.trim(), regPassword.trim(), regSucursal.trim());
      guardarSesion(data);
      Swal.fire({ icon: "success", title: "Cuenta creada", text: "Te uniste a la sucursal correctamente.", timer: 1800, showConfirmButton: false });
      navigate("/");
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    } finally {
      setCargandoRegistro(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">StockAlert</h1>
          <p className="text-sm text-slate-400">Sistema de control de inventario</p>
        </div>

        <form onSubmit={manejarLogin} className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-300">Iniciar sesión</h2>
          <input
            type="email"
            placeholder="tu@email.com"
            required
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand focus:outline-none"
          />
          <PasswordInput id="loginPassword" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
          <button
            type="submit"
            disabled={cargandoLogin}
            className="w-full rounded-lg bg-brand py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {cargandoLogin ? "Ingresando..." : "Ingresar al sistema"}
          </button>
        </form>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="h-px flex-1 bg-slate-800" />
          o unite a una sucursal existente
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        <form onSubmit={manejarRegistro} className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-300">Crear cuenta</h2>
          <input
            type="text"
            placeholder="Nombre completo"
            required
            value={regNombre}
            onChange={(e) => setRegNombre(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand focus:outline-none"
          />
          <input
            type="email"
            placeholder="tu@email.com"
            required
            value={regEmail}
            onChange={(e) => setRegEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand focus:outline-none"
          />
          <PasswordInput id="regPassword" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />
          <input
            type="number"
            placeholder="Número de sucursal (ej: 402)"
            required
            value={regSucursal}
            onChange={(e) => setRegSucursal(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand focus:outline-none"
          />
          <button
            type="submit"
            disabled={cargandoRegistro}
            className="w-full rounded-lg border border-slate-700 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {cargandoRegistro ? "Creando..." : "Crear cuenta"}
          </button>
        </form>
      </div>
    </div>
  );
}
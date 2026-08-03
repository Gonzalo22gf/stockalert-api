import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { login, registrar, olvidePassword } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import PasswordInput from "../components/PasswordInput";
import Boton from "../components/ui/Boton";
import { Input } from "../components/ui/Input";

export default function LoginPage() {
  const navigate = useNavigate();
  const guardarSesion = useAuthStore((s) => s.guardarSesion);

  // Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [cargandoLogin, setCargandoLogin] = useState(false);

  // Registro
  const [modoRegistro, setModoRegistro] = useState("unir"); // "crear" o "unir"
  const [regNombre, setRegNombre] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regEmpresa, setRegEmpresa] = useState("");
  const [regSucursal, setRegSucursal] = useState("");
  const [cargandoRegistro, setCargandoRegistro] = useState(false);

  async function manejarLogin(e) {
    e.preventDefault();
    setCargandoLogin(true);
    try {
      const data = await login(loginEmail.trim(), loginPassword.trim());
      guardarSesion(data);
      Swal.fire({ icon: "success", title: "Bienvenido", text: "Ingresaste como " + data.nombre, timer: 1600, showConfirmButton: false });
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
      const data = await registrar({
        nombre: regNombre.trim(),
        email: regEmail.trim(),
        password: regPassword.trim(),
        modo: modoRegistro,
        nombreEmpresa: regEmpresa.trim(),
        numeroSucursal: modoRegistro === "unir" ? regSucursal.trim() : undefined
      });
      guardarSesion(data);
      const msg = modoRegistro === "crear"
        ? "Empresa creada correctamente. Sos el administrador."
        : "Te uniste a la sucursal correctamente.";
      Swal.fire({ icon: "success", title: "Cuenta creada", text: msg, timer: 2000, showConfirmButton: false });
      navigate("/");
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    } finally {
      setCargandoRegistro(false);
    }
  }

  async function manejarOlvide() {
    const { value: email } = await Swal.fire({
      title: "Recuperar contraseña",
      input: "email",
      inputLabel: "Ingresa el email de tu cuenta",
      inputPlaceholder: "tu@email.com",
      inputValue: loginEmail,
      showCancelButton: true,
      confirmButtonText: "Enviar link",
      cancelButtonText: "Cancelar",
      validationMessage: "Ingresa un email valido"
    });
    if (!email) return;
    try {
      const respuesta = await olvidePassword(email.trim());
      Swal.fire({ icon: "success", title: "Revisa tu correo", text: respuesta.mensaje || "Si el correo esta registrado, te enviamos un link para restablecer la contrasena." });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
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

        {/* LOGIN */}
        <form onSubmit={manejarLogin} className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-300">Iniciar sesion</h2>
          <Input type="email" placeholder="tu@email.com" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
          <PasswordInput id="loginPassword" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
          <div className="text-right">
            <button type="button" onClick={manejarOlvide} className="text-xs font-medium text-brand-400 hover:underline">
              Olvidaste tu contrasena?
            </button>
          </div>
          <Boton type="submit" disabled={cargandoLogin} className="w-full">
            {cargandoLogin ? "Ingresando..." : "Ingresar al sistema"}
          </Boton>
        </form>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="h-px flex-1 bg-slate-800" />
          o crea tu cuenta
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        {/* REGISTRO */}
        <form onSubmit={manejarRegistro} className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-300">Crear cuenta</h2>

          {/* Toggle modo */}
          <div className="flex rounded-lg border border-slate-700 overflow-hidden text-xs font-semibold">
            <button
              type="button"
              onClick={() => setModoRegistro("unir")}
              className={`flex-1 py-2 transition-colors ${modoRegistro === "unir" ? "bg-brand text-white" : "bg-transparent text-slate-400 hover:text-slate-300"}`}
            >
              Unirme a una empresa
            </button>
            <button
              type="button"
              onClick={() => setModoRegistro("crear")}
              className={`flex-1 py-2 transition-colors ${modoRegistro === "crear" ? "bg-brand text-white" : "bg-transparent text-slate-400 hover:text-slate-300"}`}
            >
              Crear mi empresa
            </button>
          </div>

          <Input type="text" placeholder="Nombre completo" required value={regNombre} onChange={(e) => setRegNombre(e.target.value)} />
          <Input type="email" placeholder="tu@email.com" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
          <PasswordInput id="regPassword" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />

          {modoRegistro === "crear" ? (
            <Input type="text" placeholder="Nombre de tu empresa (ej: Supermercado Don Juan)" required value={regEmpresa} onChange={(e) => setRegEmpresa(e.target.value)} />
          ) : (
            <>
              <Input type="text" placeholder="Nombre de la empresa a la que te unes" required value={regEmpresa} onChange={(e) => setRegEmpresa(e.target.value)} />
              <Input type="number" placeholder="Numero de sucursal (ej: 402)" required value={regSucursal} onChange={(e) => setRegSucursal(e.target.value)} />
            </>
          )}

          <p className="text-[11px] text-slate-500">
            {modoRegistro === "crear"
              ? "Creas una empresa nueva y quedas como administrador."
              : "Te sumas como jefe a una sucursal de una empresa ya registrada."}
          </p>

          <Boton type="submit" variante="secondary" disabled={cargandoRegistro} className="w-full">
            {cargandoRegistro ? "Creando..." : modoRegistro === "crear" ? "Crear empresa y cuenta" : "Unirme a la empresa"}
          </Boton>
        </form>
      </div>
    </div>
  );
}

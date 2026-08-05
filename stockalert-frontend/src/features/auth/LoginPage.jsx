import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { login, registrar, olvidePassword } from "./api";
import { useAuthStore } from "./authStore";
import PasswordInput from "../../components/PasswordInput";
import Boton from "../../components/ui/Boton";
import { Input } from "../../components/ui/Input";

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const guardarSesion = useAuthStore((s) => s.guardarSesion);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [cargandoLogin, setCargandoLogin] = useState(false);
  const [modoRegistro, setModoRegistro] = useState("unir");
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
      Swal.fire({ icon: "success", title: t("login.bienvenido"), text: t("login.ingresasteComo") + " " + data.nombre, timer: 1600, showConfirmButton: false });
      navigate("/");
    } catch (error) {
      Swal.fire({ icon: "error", title: t("login.error"), text: error.message });
    } finally {
      setCargandoLogin(false);
    }
  }

  async function manejarRegistro(e) {
    e.preventDefault();
    setCargandoRegistro(true);
    try {
      const data = await registrar({
        nombre: regNombre.trim(), email: regEmail.trim(), password: regPassword.trim(),
        modo: modoRegistro, nombreEmpresa: regEmpresa.trim(),
        numeroSucursal: modoRegistro === "unir" ? regSucursal.trim() : undefined
      });
      guardarSesion(data);
      const msg = modoRegistro === "crear" ? t("login.creacionExitosa") : t("login.unionExitosa");
      Swal.fire({ icon: "success", title: t("login.cuentaCreada"), text: msg, timer: 2000, showConfirmButton: false });
      navigate("/");
    } catch (error) {
      Swal.fire({ icon: "error", title: t("login.error"), text: error.message });
    } finally {
      setCargandoRegistro(false);
    }
  }

  async function manejarOlvide() {
    const { value: email } = await Swal.fire({
      title: t("login.recuperar"),
      input: "email",
      inputLabel: t("login.emailLabel"),
      inputPlaceholder: t("login.email"),
      inputValue: loginEmail,
      showCancelButton: true,
      confirmButtonText: t("login.enviarLink"),
      cancelButtonText: t("login.cancelar")
    });
    if (!email) return;
    try {
      const respuesta = await olvidePassword(email.trim());
      Swal.fire({ icon: "success", title: t("login.revisaCorreo"), text: respuesta.mensaje });
    } catch (error) {
      Swal.fire({ icon: "error", title: t("login.error"), text: error.message });
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
          <h1 className="text-xl font-bold text-white">{t("login.titulo")}</h1>
          <p className="text-sm text-slate-400">{t("login.subtitulo")}</p>
        </div>

        {/* LOGIN */}
        <form onSubmit={manejarLogin} className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-300">{t("login.iniciarSesion")}</h2>
          <Input type="email" placeholder={t("login.email")} required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
          <PasswordInput id="loginPassword" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
          <div className="text-right">
            <button type="button" onClick={manejarOlvide} className="text-xs font-medium text-brand-400 hover:underline">
              {t("login.olvidaste")}
            </button>
          </div>
          <Boton type="submit" disabled={cargandoLogin} className="w-full">
            {cargandoLogin ? t("login.ingresando") : t("login.ingresar")}
          </Boton>
        </form>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="h-px flex-1 bg-slate-800" />
          {t("login.oCreaTuCuenta")}
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        {/* REGISTRO */}
        <form onSubmit={manejarRegistro} className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-300">{t("login.crearCuenta")}</h2>
          <div className="flex rounded-lg border border-slate-700 overflow-hidden text-xs font-semibold">
            <button type="button" onClick={() => setModoRegistro("unir")}
              className={`flex-1 py-2 transition-colors ${modoRegistro === "unir" ? "bg-brand text-white" : "bg-transparent text-slate-400 hover:text-slate-300"}`}>
              {t("login.unirseTitulo")}
            </button>
            <button type="button" onClick={() => setModoRegistro("crear")}
              className={`flex-1 py-2 transition-colors ${modoRegistro === "crear" ? "bg-brand text-white" : "bg-transparent text-slate-400 hover:text-slate-300"}`}>
              {t("login.crearTitulo")}
            </button>
          </div>
          <Input type="text" placeholder={t("login.nombreCompleto")} required value={regNombre} onChange={(e) => setRegNombre(e.target.value)} />
          <Input type="email" placeholder={t("login.email")} required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
          <PasswordInput id="regPassword" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />
          {modoRegistro === "crear" ? (
            <Input type="text" placeholder={t("login.nombreEmpresa")} required value={regEmpresa} onChange={(e) => setRegEmpresa(e.target.value)} />
          ) : (
            <>
              <Input type="text" placeholder={t("login.codigoAcceso")} required value={regEmpresa} onChange={(e) => setRegEmpresa(e.target.value)} />
              <Input type="number" placeholder={t("login.numeroSucursal")} required value={regSucursal} onChange={(e) => setRegSucursal(e.target.value)} />
            </>
          )}
          <p className="text-[11px] text-slate-500">
            {modoRegistro === "crear" ? t("login.textoCrear") : t("login.textoUnir")}
          </p>
          <Boton type="submit" variante="secondary" disabled={cargandoRegistro} className="w-full">
            {cargandoRegistro ? t("login.creando") : modoRegistro === "crear" ? t("login.btnCrear") : t("login.btnUnir")}
          </Boton>
        </form>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { restablecerPassword } from "./api";
import PasswordInput from "../../components/PasswordInput";
import Boton from "../../components/ui/Boton";

export default function RestablecerPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [cargando, setCargando] = useState(false);

  async function manejarSubmit(e) {
    e.preventDefault();
    if (password.length < 8) {
      Swal.fire({ icon: "warning", title: t("restablecer.muyCorta"), text: t("restablecer.requisitos") });
      return;
    }
    if (password !== confirmar) {
      Swal.fire({ icon: "warning", title: t("restablecer.noCoinciden"), text: t("restablecer.noIguales") });
      return;
    }
    setCargando(true);
    try {
      const respuesta = await restablecerPassword(token, password);
      await Swal.fire({ icon: "success", title: t("restablecer.listo"), text: respuesta.mensaje || t("restablecer.restablecida") });
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
          <h1 className="text-xl font-bold text-white">{t("restablecer.titulo")}</h1>
          <p className="text-sm text-slate-400">{t("restablecer.subtitulo")}</p>
        </div>

        {!token ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-red-400">{t("restablecer.linkInvalido")}</p>
            <Link to="/login" className="text-sm font-semibold text-brand-400 hover:underline">
              {t("restablecer.volverLogin")}
            </Link>
          </div>
        ) : (
          <form onSubmit={manejarSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">{t("restablecer.nuevaPassword")}</label>
              <PasswordInput id="nuevaPassword" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">{t("restablecer.repetir")}</label>
              <PasswordInput id="confirmarPassword" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} required />
            </div>
            <Boton type="submit" disabled={cargando} className="w-full">
              {cargando ? t("swal.guardando") : t("restablecer.guardarNueva")}
            </Boton>
            <div className="text-center">
              <Link to="/login" className="text-xs text-slate-500 hover:text-slate-300">
                {t("restablecer.volverLogin")}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

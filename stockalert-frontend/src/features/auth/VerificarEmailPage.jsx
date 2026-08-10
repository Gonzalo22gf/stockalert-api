import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { apiGet } from "../../lib/client";

export default function VerificarEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [estado, setEstado] = useState("cargando"); // cargando | ok | error
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) { setEstado("error"); setMensaje("El link es invalido."); return; }
    apiGet("/api/usuarios/verificar-email?token=" + token)
      .then((data) => { setEstado("ok"); setMensaje(data.mensaje); })
      .catch((e) => { setEstado("error"); setMensaje(e.message || "El link es invalido o expiro."); });
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#05050a] p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
        {estado === "cargando" && (
          <>
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            <p className="text-sm text-slate-400">Verificando tu email...</p>
          </>
        )}
        {estado === "ok" && (
          <>
            <div className="mb-4 text-5xl">✅</div>
            <h1 className="text-lg font-bold text-white">Email verificado</h1>
            <p className="mt-2 text-sm text-slate-400">{mensaje}</p>
            <button
              onClick={() => navigate("/login")}
              className="mt-6 w-full rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
            >
              Ir al login
            </button>
          </>
        )}
        {estado === "error" && (
          <>
            <div className="mb-4 text-5xl">❌</div>
            <h1 className="text-lg font-bold text-white">Link invalido</h1>
            <p className="mt-2 text-sm text-slate-400">{mensaje}</p>
            <button
              onClick={() => navigate("/login")}
              className="mt-6 w-full rounded-xl border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
            >
              Volver al login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

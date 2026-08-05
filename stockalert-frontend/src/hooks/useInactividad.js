import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuthStore } from "../features/auth/authStore";

const TIEMPO_LIMITE = 10 * 60 * 1000; // 10 minutos en ms

export function useInactividad() {
  const cerrarSesion = useAuthStore((s) => s.cerrarSesion);
  const navigate = useNavigate();
  const timerRef = useRef(null);

  useEffect(() => {
    function resetear() {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        cerrarSesion();
        await Swal.fire({
          icon: "info",
          title: "Sesion cerrada",
          text: "Tu sesion se cerro por inactividad. Vuelve a ingresar.",
          confirmButtonText: "Ir al login",
          allowOutsideClick: false
        });
        navigate("/login");
      }, TIEMPO_LIMITE);
    }

    // Eventos que reinician el timer
    const eventos = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];
    eventos.forEach((e) => window.addEventListener(e, resetear, { passive: true }));

    // Arrancar el timer al montar
    resetear();

    return () => {
      clearTimeout(timerRef.current);
      eventos.forEach((e) => window.removeEventListener(e, resetear));
    };
  }, [cerrarSesion, navigate]);
}

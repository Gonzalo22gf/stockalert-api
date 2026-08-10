import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuthStore } from "../features/auth/authStore";

const TIEMPO_LIMITE = 10 * 60 * 1000; // 10 minutos en ms
const CLAVE_ULTIMA_ACTIVIDAD = "stockalert-ultima-actividad";

export function useInactividad() {
  const cerrarSesion = useAuthStore((s) => s.cerrarSesion);
  const navigate = useNavigate();
  const timerRef = useRef(null);

  useEffect(() => {
    function registrarActividad() {
      localStorage.setItem(CLAVE_ULTIMA_ACTIVIDAD, Date.now().toString());
      resetearTimer();
    }

    function resetearTimer() {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(cerrarPorInactividad, TIEMPO_LIMITE);
    }

    async function cerrarPorInactividad() {
      cerrarSesion();
      await Swal.fire({
        icon: "info",
        title: "Sesion cerrada",
        text: "Tu sesion se cerro por inactividad. Vuelve a ingresar.",
        confirmButtonText: "Ir al login",
        allowOutsideClick: false
      });
      navigate("/login");
    }

    // Cuando la app vuelve al primer plano, chequear cuanto tiempo paso
    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        const ultimaActividad = parseInt(localStorage.getItem(CLAVE_ULTIMA_ACTIVIDAD) || "0");
        const tiempoPasado = Date.now() - ultimaActividad;
        if (ultimaActividad > 0 && tiempoPasado >= TIEMPO_LIMITE) {
          cerrarPorInactividad();
        } else {
          resetearTimer();
        }
      } else {
        // App va al background — guardar momento de ultima actividad
        localStorage.setItem(CLAVE_ULTIMA_ACTIVIDAD, Date.now().toString());
        clearTimeout(timerRef.current);
      }
    }

    const eventos = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];
    eventos.forEach((e) => window.addEventListener(e, registrarActividad, { passive: true }));
    document.addEventListener("visibilitychange", onVisibilityChange);

    // Al montar siempre registrar actividad — el chequeo de expiracion
    // solo aplica cuando la app vuelve del background, no al iniciar sesion
    registrarActividad();

    return () => {
      clearTimeout(timerRef.current);
      eventos.forEach((e) => window.removeEventListener(e, registrarActividad));
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [cerrarSesion, navigate]);
}
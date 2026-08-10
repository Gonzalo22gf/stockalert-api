import { useState, useEffect } from "react";
import { solicitarPermisoPush } from "../lib/firebase";
import { apiPost } from "../lib/client";

const PUSH_TOKEN_KEY = "stockalert-push-token";

export function usePush() {
  const [activado, setActivado] = useState(false);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const tokenGuardado = localStorage.getItem(PUSH_TOKEN_KEY);
    setActivado(!!tokenGuardado);
  }, []);

  async function activar() {
    setCargando(true);
    try {
      const token = await solicitarPermisoPush();
      if (!token) return;
      await apiPost("/api/push/suscribir", { token, dispositivo: "web" });
      localStorage.setItem(PUSH_TOKEN_KEY, token);
      setActivado(true);
    } catch (e) {
      console.error("Error al activar push:", e);
    } finally {
      setCargando(false);
    }
  }

  async function desactivar() {
    setCargando(true);
    try {
      const token = localStorage.getItem(PUSH_TOKEN_KEY);
      if (!token) return;
      await apiPost("/api/push/desuscribir", { token });
      localStorage.removeItem(PUSH_TOKEN_KEY);
      setActivado(false);
    } catch (e) {
      console.error("Error al desactivar push:", e);
    } finally {
      setCargando(false);
    }
  }

  return { activado, cargando, activar, desactivar };
}

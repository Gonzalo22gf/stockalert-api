import { useState, useEffect } from "react";

const CLAVE = "stockalert-tema";

// Lee la preferencia guardada; si no hay, usa "oscuro" (el modo por defecto de la app).
function temaInicial() {
  if (typeof localStorage !== "undefined") {
    const guardado = localStorage.getItem(CLAVE);
    if (guardado === "claro" || guardado === "oscuro") return guardado;
  }
  return "oscuro";
}

// Aplica el tema al <html>: agrega la clase "light" en modo claro, la saca en oscuro.
function aplicarTema(tema) {
  const html = document.documentElement;
  if (tema === "claro") html.classList.add("light");
  else html.classList.remove("light");
}

// Hook de tema: expone el tema actual y una funcion para alternarlo.
// Centraliza la logica (localStorage + clase en el html) en un solo lugar.
export function useTema() {
  const [tema, setTema] = useState(temaInicial);

  useEffect(() => {
    aplicarTema(tema);
    localStorage.setItem(CLAVE, tema);
  }, [tema]);

  function alternar() {
    setTema((t) => (t === "oscuro" ? "claro" : "oscuro"));
  }

  return { tema, alternar };
}

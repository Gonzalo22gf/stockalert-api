import { useState, useEffect, useRef } from "react";

export function useCountUp(valorFinal, duracion = 900) {
  const [valor, setValor] = useState(0);
  const refValorPrevio = useRef(0);

  useEffect(() => {
    const inicio = refValorPrevio.current;
    const fin = Number(valorFinal) || 0;
    const tiempoInicio = performance.now();

    let frame;
    function animar(ahora) {
      const progreso = Math.min((ahora - tiempoInicio) / duracion, 1);
      // easing suave (easeOutCubic)
      const eased = 1 - Math.pow(1 - progreso, 3);
      const actual = inicio + (fin - inicio) * eased;
      setValor(actual);
      if (progreso < 1) {
        frame = requestAnimationFrame(animar);
      } else {
        setValor(fin);
        refValorPrevio.current = fin;
      }
    }

    frame = requestAnimationFrame(animar);
    return () => cancelAnimationFrame(frame);
  }, [valorFinal, duracion]);

  return valor;
}
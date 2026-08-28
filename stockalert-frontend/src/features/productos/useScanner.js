import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

// Encapsula todo el ciclo de vida del lector de codigos de barras (html5-qrcode).
// - activo: cuando es true arranca la camara sobre el elemento #elementoId; cuando pasa a false la detiene.
// - elementoId: id del <div> donde se monta el visor.
// - onDetectado: callback que recibe el codigo leido (se dispara una sola vez por apertura).
// Expone detener() para cerrar la camara manualmente (ej. boton Cerrar).
// El stop() NO se llama dentro del callback de deteccion a proposito: eso crashea en Android.
export function useScanner({ activo, elementoId, onDetectado }) {
  const scannerRef = useRef(null);
  const yaDetectadoRef = useRef(false);
  const onDetectadoRef = useRef(onDetectado);
  onDetectadoRef.current = onDetectado;

  // Detiene y limpia la camara de forma segura (los errores de stop/clear en Android se ignoran).
  async function detener() {
    const s = scannerRef.current;
    scannerRef.current = null;
    if (!s) return;
    try {
      if (s.isScanning) {
        await s.stop();
      }
      await s.clear();
    } catch (e) {
      // errores conocidos de stop/clear en Android: se ignoran
    }
  }

  useEffect(() => {
    if (!activo) return;

    yaDetectadoRef.current = false;
    const scanner = new Html5Qrcode(elementoId, {
      // usa el detector nativo de Chrome si existe (mucho mas estable en Android)
      experimentalFeatures: { useBarCodeDetectorIfSupported: true },
      verbose: false
    });
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (texto) => {
          // No llamamos stop() aca adentro (crashea en Android): marcamos y cerramos en el proximo tick.
          if (yaDetectadoRef.current) return;
          yaDetectadoRef.current = true;
          const codigo = texto;
          setTimeout(async () => {
            await detener();
            onDetectadoRef.current(codigo);
          }, 0);
        },
        () => {}
      )
      .catch((err) => console.error("Error camara:", err));

    return () => {
      detener();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo, elementoId]);

  return { detener };
}

import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function EscanerEAN({ onDetectado, onCerrar }) {
  const scannerRef = useRef(null);
  const contenedorId = "lector-ean";

  useEffect(() => {
    const scanner = new Html5Qrcode(contenedorId);
    scannerRef.current = scanner;
    let activo = true;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (textoDecodificado) => {
          if (!activo) return;
          activo = false;
          onDetectado(textoDecodificado);
          scanner.stop().then(() => scanner.clear()).catch(() => {});
        },
        () => {}
      )
      .catch((err) => {
        console.error("Error al iniciar el escáner:", err);
      });

    return () => {
      activo = false;
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current.clear())
          .catch(() => {});
      }
    };
  }, [onDetectado]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onCerrar}>
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-3 text-base font-bold text-white">📷 Escanear código de barras</h2>
        <p className="mb-3 text-xs text-slate-400">Apuntá la cámara al código de barras del producto.</p>

        <div id={contenedorId} className="overflow-hidden rounded-lg border border-slate-700" />

        <button
          onClick={onCerrar}
          className="mt-4 w-full rounded-lg border border-slate-700 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
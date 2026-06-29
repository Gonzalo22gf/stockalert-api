import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const HIDDEN_ID = "__ean_scanner_hidden__";

export default function EscanerEAN({ onDetectado, onCerrar }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervaloRef = useRef(null);
  const wakeLockRef = useRef(null);
  const activoRef = useRef(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    activoRef.current = true;

    const iniciar = async () => {
      try {
        // evita que la pantalla se apague mientras escanea
        if ("wakeLock" in navigator) {
          try { wakeLockRef.current = await navigator.wakeLock.request("screen"); } catch {}
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        });

        if (!activoRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        if ("BarcodeDetector" in window) {
          // Chrome Android — detección nativa
          const detector = new window.BarcodeDetector({
            formats: ["ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e"],
          });
          intervaloRef.current = setInterval(async () => {
            if (!activoRef.current) return;
            try {
              const codes = await detector.detect(videoRef.current);
              if (codes.length > 0 && activoRef.current) {
                activoRef.current = false;
                clearInterval(intervaloRef.current);
                onDetectado(codes[0].rawValue);
              }
            } catch {}
          }, 300);
        } else {
          // iOS Safari — fallback con canvas + html5-qrcode scanFile
          const qr = new Html5Qrcode(HIDDEN_ID);
          const canvas = canvasRef.current;

          intervaloRef.current = setInterval(async () => {
            if (!activoRef.current || !videoRef.current?.videoWidth) return;
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
            canvas.toBlob(async (blob) => {
              if (!blob || !activoRef.current) return;
              const file = new File([blob], "frame.jpg", { type: "image/jpeg" });
              try {
                const resultado = await qr.scanFile(file, false);
                if (activoRef.current) {
                  activoRef.current = false;
                  clearInterval(intervaloRef.current);
                  onDetectado(resultado);
                }
              } catch {}
            }, "image/jpeg", 0.8);
          }, 500);
        }
      } catch {
        if (activoRef.current) {
          setError("No se pudo acceder a la cámara. Verificá los permisos.");
        }
      }
    };

    iniciar();

    return () => {
      activoRef.current = false;
      clearInterval(intervaloRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      wakeLockRef.current?.release().catch(() => {});
    };
  }, [onDetectado]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onCerrar}>
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-3 text-base font-bold text-white">📷 Escanear código de barras</h2>
        <p className="mb-3 text-xs text-slate-400">Apuntá la cámara al código de barras del producto.</p>

        {error ? (
          <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-red-800 bg-red-900/20 p-4 text-center text-sm text-red-300">
            {error}
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-lg border border-slate-700 bg-black">
            <video
              ref={videoRef}
              playsInline
              muted
              style={{ width: "100%", display: "block", minHeight: "220px" }}
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-14 w-60 rounded border-2 border-green-400/80" />
            </div>
          </div>
        )}

        <div id={HIDDEN_ID} style={{ display: "none" }} />
        <canvas ref={canvasRef} style={{ display: "none" }} />

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

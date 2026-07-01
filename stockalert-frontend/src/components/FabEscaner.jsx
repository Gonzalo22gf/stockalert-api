import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import Swal from "sweetalert2";
import { useAuthStore } from "../store/authStore";
import { useCrearProducto, useProductos } from "../hooks/useProductos";
import { useSucursales } from "../hooks/useSucursales";

const CATEGORIAS = ["Lácteos", "Bebidas", "Almacén", "Limpieza", "Congelados"];

export default function FabEscaner() {
  const usuario = useAuthStore((s) => s.usuario);
  const esAdmin = usuario?.rol === "admin";

  const [abierto, setAbierto] = useState(false);
  const [eanDetectado, setEanDetectado] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);

  const crearProducto = useCrearProducto();
  const { data: sucursales } = useSucursales(esAdmin);
  const { data: productos } = useProductos(undefined);

  const scannerRef = useRef(null);
  const yaDetectadoRef = useRef(false);

  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [precio, setPrecio] = useState("");
  const [lote, setLote] = useState("");
  const [stock, setStock] = useState("");
  const [vencimiento, setVencimiento] = useState("");
  const [sucursalId, setSucursalId] = useState("");

  function limpiarCampos() {
    setNombre("");
    setCategoria("");
    setPrecio("");
    setLote("");
    setStock("");
    setVencimiento("");
  }

  // Detiene el scanner de forma segura (fuera del callback, para evitar el crash conocido de stop())
  async function detenerScanner() {
    const s = scannerRef.current;
    scannerRef.current = null;
    if (!s) return;
    try {
      if (s.isScanning) {
        await s.stop();
      }
      await s.clear();
    } catch (e) {
      // ignorar errores de stop/clear (conocidos en Android)
    }
  }

  useEffect(() => {
    if (!abierto || mostrarForm) return;

    yaDetectadoRef.current = false;
    const scanner = new Html5Qrcode("fab-lector", {
      // usa el detector nativo de Chrome si existe (mucho más estable en Android)
      experimentalFeatures: { useBarCodeDetectorIfSupported: true },
      verbose: false
    });
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (texto) => {
          // NO llamamos stop() acá adentro (eso crashea en Android).
          // Solo marcamos y agendamos el cierre para el próximo tick.
          if (yaDetectadoRef.current) return;
          yaDetectadoRef.current = true;
          const codigo = texto;
          setTimeout(async () => {
            await detenerScanner();
            manejarDetectado(codigo);
          }, 0);
        },
        () => {}
      )
      .catch((err) => console.error("Error cámara:", err));

    return () => {
      detenerScanner();
    };
  }, [abierto, mostrarForm]);

  function manejarDetectado(codigo) {
    setEanDetectado(codigo);
    const existente = (productos || []).find((p) => p.codigoBarras === codigo);
    if (existente) {
      setNombre(existente.nombre);
      setCategoria(existente.categoria);
      setPrecio(String(existente.precio));
    }
    setMostrarForm(true);
  }

  async function guardarYSeguir(e) {
    e.preventDefault();

    if (!nombre || !categoria || !precio || !stock || !vencimiento) {
      Swal.fire({ icon: "warning", title: "Datos incompletos", text: "Completá todos los campos." });
      return;
    }
    if (esAdmin && !sucursalId) {
      Swal.fire({ icon: "warning", title: "Falta sucursal", text: "Elegí la sucursal." });
      return;
    }

    try {
      await crearProducto.mutateAsync({
        nombre,
        categoria,
        precio: Number(precio),
        lote,
        stock: Number(stock),
        vencimiento,
        codigoBarras: eanDetectado,
        lotes: [{ numero: lote, stock: Number(stock), vencimiento }],
        ...(esAdmin ? { sucursal: sucursalId } : {})
      });

      await Swal.fire({ icon: "success", title: "Guardado", text: "Listo para escanear el siguiente.", timer: 1200, showConfirmButton: false });

      limpiarCampos();
      setEanDetectado("");
      setMostrarForm(false);
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    }
  }

  async function cerrarTodo() {
    await detenerScanner();
    setMostrarForm(false);
    setAbierto(false);
    setEanDetectado("");
    limpiarCampos();
    setSucursalId("");
  }

  const inputClase =
    "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand focus:outline-none";

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        title="Escanear producto"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg hover:opacity-90"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 7V5a2 2 0 0 1 2-2h2" />
          <path d="M17 3h2a2 2 0 0 1 2 2v2" />
          <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
          <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
          <line x1="7" y1="12" x2="17" y2="12" />
        </svg>
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6">
            {!mostrarForm ? (
              <>
                <h2 className="mb-3 text-base font-bold text-white">📷 Escaneo continuo</h2>
                <p className="mb-3 text-xs text-slate-400">Apuntá al código de barras. Después de guardar, la cámara sigue activa.</p>
                <div id="fab-lector" className="overflow-hidden rounded-lg border border-slate-700" />
                <button
                  onClick={cerrarTodo}
                  className="mt-4 w-full rounded-lg border border-slate-700 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cerrar
                </button>
              </>
            ) : (
              <form onSubmit={guardarYSeguir} className="space-y-3">
                <h2 className="text-base font-bold text-white">Cargar producto</h2>
                <p className="text-xs text-slate-400">
                  EAN: <span className="font-mono text-brand">{eanDetectado || "sin código"}</span>
                </p>

                <input className={inputClase} placeholder="Nombre del producto" value={nombre} onChange={(e) => setNombre(e.target.value)} />
                <select className={inputClase} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                  <option value="">Categoría</option>
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input className={inputClase} type="number" placeholder="Precio $" value={precio} onChange={(e) => setPrecio(e.target.value)} />
                  <input className={inputClase} placeholder="Lote" value={lote} onChange={(e) => setLote(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input className={inputClase} type="number" placeholder="Stock" value={stock} onChange={(e) => setStock(e.target.value)} />
                  <input className={inputClase} type="date" value={vencimiento} onChange={(e) => setVencimiento(e.target.value)} />
                </div>
                {esAdmin && (
                  <select className={inputClase} value={sucursalId} onChange={(e) => setSucursalId(e.target.value)}>
                    <option value="">Sucursal del producto</option>
                    {(sucursales || []).map((s) => (
                      <option key={s._id} value={s._id}>{s.nombre}</option>
                    ))}
                  </select>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={crearProducto.isPending}
                    className="flex-1 rounded-lg bg-brand py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {crearProducto.isPending ? "Guardando..." : "Guardar y seguir"}
                  </button>
                  <button
                    type="button"
                    onClick={cerrarTodo}
                    className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800"
                  >
                    Cerrar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

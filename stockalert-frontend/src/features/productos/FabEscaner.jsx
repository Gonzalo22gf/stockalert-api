import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCategorias } from "../categorias/useCategorias";
import Swal from "sweetalert2";
import { useAuthStore } from "../auth/authStore";
import { useCrearProducto, useProductos } from "./useProductos";
import { buscarProductoPorEAN } from "./useOpenFoodFacts";
import { subirImagen } from "../../lib/cloudinary";
import { useSucursales } from "../sucursales/useSucursales";
import { useScanner } from "./useScanner";


export default function FabEscaner() {
  const { t } = useTranslation();
  const { data: categorias = [] } = useCategorias();
  const usuario = useAuthStore((s) => s.usuario);
  const esAdmin = usuario?.rol === "admin";

  const [abierto, setAbierto] = useState(false);
  const [eanDetectado, setEanDetectado] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);

  const crearProducto = useCrearProducto();
  const { data: sucursales } = useSucursales(esAdmin);
  const { data: productos } = useProductos(undefined);

  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [precio, setPrecio] = useState("");
  const [lote, setLote] = useState("");
  const [stock, setStock] = useState("");
  const [tamano, setTamano] = useState("");
  const [imagenAuto, setImagenAuto] = useState("");
  const [imagen, setImagen] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [vencimiento, setVencimiento] = useState("");
  const [vence, setVence] = useState(true);
  const [buscandoEAN, setBuscandoEAN] = useState(false);
  const [sucursalId, setSucursalId] = useState("");

  // La camara vive activa mientras el modal esta abierto y no se muestra el formulario.
  const { detener } = useScanner({
    activo: abierto && !mostrarForm,
    elementoId: "fab-lector",
    onDetectado: manejarDetectado
  });

  function limpiarCampos() {
    setNombre("");
    setCategoria("");
    setPrecio("");
    setLote("");
    setStock("");
    setTamano("");
    setImagenAuto("");
    setImagen("");
    setVencimiento("");
    setVence(true);
  }

  async function manejarDetectado(codigo) {
    setEanDetectado(codigo);
    setMostrarForm(true);
    const existente = (productos || []).find((p) => p.codigoBarras === codigo);
    if (existente) {
      setNombre(existente.nombre);
      setCategoria(existente.categoria);
      setPrecio(String(existente.precio));
      if (existente.tamano) setTamano(existente.tamano);
      return;
    }
    // No lo tenemos: buscar en Open Food Facts para autocompletar
    setBuscandoEAN(true);
    try {
      const datos = await buscarProductoPorEAN(codigo);
      if (datos) {
        if (datos.nombre) setNombre(datos.nombre);
        if (datos.categoria) setCategoria(datos.categoria);
        if (datos.tamano) setTamano(datos.tamano);
        if (datos.imagen) setImagenAuto(datos.imagen);
      }
    } catch {
      // sin conexion o sin match: se carga a mano
    } finally {
      setBuscandoEAN(false);
    }
  }

  async function manejarSubirFoto(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setSubiendo(true);
    try {
      const url = await subirImagen(file);
      setImagen(url);
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    } finally {
      setSubiendo(false);
    }
  }

  async function guardarYSeguir(e) {
    e.preventDefault();

    if (!nombre || !categoria || !precio || !stock || (vence && !vencimiento)) {
      Swal.fire({ icon: "warning", title: t("swal.datosIncompletos"), text: t("swal.completaCampos") });
      return;
    }
    if (esAdmin && !sucursalId) {
      Swal.fire({ icon: "warning", title: t("swal.faltaSucursal"), text: t("swal.elegiSucursal") });
      return;
    }

    try {
      await crearProducto.mutateAsync({
        nombre,
        categoria,
        precio: Number(precio),
        lote,
        stock: Number(stock),
        vence,
        codigoBarras: eanDetectado,
        tamano,
        imagenAuto,
        imagen,
        ...(vence
          ? { vencimiento, lotes: [{ numero: lote, stock: Number(stock), vencimiento }] }
          : { lotes: [] }),
        ...(esAdmin ? { sucursal: sucursalId } : {})
      });

      await Swal.fire({ icon: "success", title: t("swal.guardado"), text: t("swal.listoSiguiente"), timer: 1200, showConfirmButton: false });

      limpiarCampos();
      setEanDetectado("");
      setMostrarForm(false);
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    }
  }

  async function cerrarTodo() {
    await detener();
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
        title={t("escaner.titulo")}
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
                <div className="flex items-center gap-3">
                  {(imagen || imagenAuto) && (
                    <img src={imagen || imagenAuto} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                  )}
                  <label className="cursor-pointer rounded-lg border border-brand/40 bg-brand/10 px-3 py-2 text-xs font-semibold text-brand-400 hover:bg-brand/20">
                    {subiendo ? t("form.subiendoFoto") : t("form.subirFoto")}
                    <input type="file" accept="image/*" className="hidden" disabled={subiendo} onChange={manejarSubirFoto} />
                  </label>
                  {imagen && (
                    <button type="button" onClick={() => setImagen("")} className="text-xs font-medium text-slate-400 hover:text-red-400">
                      {t("form.quitarFoto")}
                    </button>
                  )}
                </div>

                <input className={inputClase} placeholder="Nombre del producto" value={nombre} onChange={(e) => setNombre(e.target.value)} />
                <select className={inputClase} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                  <option value="">{t("productos.categoria")}</option>
                  {categorias.map((c) => (
                    <option key={c._id} value={c.nombre}>{c.nombre}</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input className={inputClase} type="number" placeholder="Precio $" value={precio} onChange={(e) => setPrecio(e.target.value)} />
                  <input className={inputClase} placeholder="Lote" value={lote} onChange={(e) => setLote(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input className={inputClase} type="number" placeholder="Stock" value={stock} onChange={(e) => setStock(e.target.value)} />
                  <input className={inputClase} placeholder={t("form.tamano")} value={tamano} onChange={(e) => setTamano(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-400">{t("form.fechaVencimiento")}</label>
                  <input className={inputClase} type="date" value={vencimiento} disabled={!vence} onChange={(e) => setVencimiento(e.target.value)} />
                  <label className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                    <input type="checkbox" checked={!vence} onChange={(e) => setVence(!e.target.checked)} />
                    {t("form.noVence")}
                  </label>
                </div>
                {esAdmin && (
                  <select className={inputClase} value={sucursalId} onChange={(e) => setSucursalId(e.target.value)}>
                    <option value="">{t("form.sucursalProducto")}</option>
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
                    {crearProducto.isPending ? t("swal.guardando") : t("escaner.guardarSeguir")}
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

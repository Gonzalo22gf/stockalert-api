import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatearMonto } from "./productos.utils";

const COLORES = ["bg-brand/20 text-brand-400", "bg-emerald-500/20 text-emerald-400", "bg-sky-500/20 text-sky-400", "bg-purple-500/20 text-purple-400", "bg-amber-500/20 text-amber-400", "bg-rose-500/20 text-rose-400"];
function colorPorNombre(nombre) {
  let suma = 0;
  for (let i = 0; i < nombre.length; i++) suma += nombre.charCodeAt(i);
  return COLORES[suma % COLORES.length];
}
function ImagenProducto({ producto }) {
  const [fallo, setFallo] = useState(false);
  const url = producto.imagen || producto.imagenAuto;
  if (url && !fallo) {
    return <img src={url} alt={producto.nombre} onError={() => setFallo(true)} className="h-11 w-11 shrink-0 rounded-lg object-cover" />;
  }
  const inicial = (producto.nombre || "?").trim().charAt(0).toUpperCase();
  return <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-lg font-bold ${colorPorNombre(producto.nombre || "")}`}>{inicial}</div>;
}
function obtenerEstado(vencimiento, vence) {
  if (vence === false || !vencimiento) return null;
  const hoy = new Date();
  const fecha = new Date(vencimiento);
  const dias = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
  if (dias < 0) return { texto: "productos.vencido", color: "bg-red-500/15 text-red-400" };
  if (dias <= 7) return { texto: "productos.porVencer", color: "bg-amber-500/15 text-amber-400" };
  return { texto: "productos.buenEstado", color: "bg-emerald-500/15 text-emerald-400" };
}

function obtenerEstadoStock(stock) {
  if (stock <= 0) return { texto: "filtros.agotado", color: "bg-red-500/15 text-red-400" };
  if (stock <= 5) return { texto: "estados.stockCritico", color: "bg-purple-500/15 text-purple-400" };
  if (stock <= 10) return { texto: "filtros.stockBajo", color: "bg-amber-500/15 text-amber-400" };
  return { texto: "estados.stockNormal", color: "bg-slate-700/60 text-slate-300" };
}

function formatearFecha(fecha) {
  if (!fecha) return "\u2014";
  return new Date(fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
}

// Calcula el tamano de letra del nombre de forma gradual segun su largo.
// Hasta 18 caracteres va a tamano pleno (16px); a partir de ahi baja de a poco
// (0.18px por caracter) con un piso de 11px, asi nunca queda ilegible ni desarma la card.
function tamanoNombrePx(nombre) {
  const largo = (nombre || "").length;
  const BASE = 16, DESDE = 18, POR_CHAR = 0.18, MIN = 11;
  if (largo <= DESDE) return BASE;
  return Math.max(MIN, BASE - (largo - DESDE) * POR_CHAR);
}
export default function ProductoCard({ producto, esAdmin, onEditar, onEliminar }) {
  const { t } = useTranslation();
  const estado = obtenerEstado(producto.vencimiento, producto.vence);
  const estadoStock = obtenerEstadoStock(producto.stock);
  return (
    <div className="animate-rise rounded-2xl border border-border-soft bg-panel p-[18px] transition-all duration-200 hover:-translate-y-1 hover:border-border hover:shadow-xl hover:shadow-black/30">
      <div className="mb-1 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <ImagenProducto producto={producto} />
          <div className="min-w-0">
            <p className="font-semibold leading-tight text-white line-clamp-2" style={{ fontSize: tamanoNombrePx(producto.nombre) + "px" }}>
              {producto.nombre}
              {producto.tamano && <span className="ml-1.5 text-xs font-medium text-slate-500">{producto.tamano}</span>}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {esAdmin && producto.sucursal?.nombre && (
            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand-400">
              {producto.sucursal.nombre}
            </span>
          )}
          {producto.codigoBarras && (
            <span className="text-[10px] font-medium tracking-wide text-slate-500">
              EAN {producto.codigoBarras}
            </span>
          )}
        </div>
      </div>
      <p className="mb-3.5 text-xs font-medium uppercase tracking-wide text-slate-600">{producto.categoria}</p>
      <div className="mb-3.5 grid grid-cols-3 gap-2 rounded-xl bg-base/60 p-3 text-center">
        <div>
          <p className="text-base font-bold text-white">{producto.stock}</p>
          <p className="text-[10px] uppercase tracking-wide text-slate-600">Stock</p>
        </div>
        <div className="border-x border-border-soft">
          <p className="font-bold text-white" style={{ fontSize: (formatearMonto(producto.precio).length > 9 ? 13 : 16) + "px" }}>{formatearMonto(producto.precio)}</p>
          <p className="text-[10px] uppercase tracking-wide text-slate-600">Precio</p>
        </div>
        <div>
          <p className="text-[13px] font-bold text-white">{formatearFecha(producto.vencimiento)}</p>
          <p className="text-[10px] uppercase tracking-wide text-slate-600">Vence</p>
        </div>
      </div>
      <div className="mb-3.5 flex flex-wrap gap-1.5">
        {estado && <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${estado.color}`}>{t(estado.texto)}</span>}
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${estadoStock.color}`}>{t(estadoStock.texto)}</span>
        {producto.lote && (
          <span className="rounded-full bg-panel-hover px-2 py-0.5 text-[10px] font-medium text-slate-400">
            Lote {producto.lote}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onEditar(producto)}
          className="flex-1 rounded-lg bg-brand/10 py-2 text-xs font-semibold text-brand-400 transition-colors hover:bg-brand/20"
        >
          Editar
        </button>
        <button
          onClick={() => onEliminar(producto)}
          className="flex-1 rounded-lg bg-red-500/10 py-2 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}

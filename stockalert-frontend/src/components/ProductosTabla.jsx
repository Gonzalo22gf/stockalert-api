import { useState } from "react";

function obtenerEstado(vencimiento) {
  const hoy = new Date();
  const dias = Math.ceil((new Date(vencimiento) - hoy) / (1000 * 60 * 60 * 24));
  if (dias < 0) return { texto: "Vencido", color: "bg-red-500/15 text-red-400" };
  if (dias <= 7) return { texto: "Por vencer", color: "bg-amber-500/15 text-amber-400" };
  return { texto: "En buen estado", color: "bg-emerald-500/15 text-emerald-400" };
}

function obtenerEstadoStock(stock) {
  if (stock <= 0) return { texto: "Agotado", color: "bg-red-500/15 text-red-400" };
  if (stock <= 5) return { texto: "Crítico", color: "bg-purple-500/15 text-purple-400" };
  if (stock <= 10) return { texto: "Bajo", color: "bg-amber-500/15 text-amber-400" };
  return { texto: "Normal", color: "bg-slate-700/60 text-slate-300" };
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function MenuAcciones({ producto, onEditar, onEliminar }) {
  const [abierto, setAbierto] = useState(false);
  const item = "block w-full px-4 py-2 text-left text-[13px] font-medium transition-colors hover:bg-[#1a1d26]";
  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setAbierto((v) => !v)}
        className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-slate-300 transition-colors hover:bg-slate-700"
        title="Acciones"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>
      {abierto && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setAbierto(false)} />
          <div className="absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-xl border border-[#2a2e3a] shadow-2xl shadow-black/60" style={{ backgroundColor: "#13151c" }}>
            <button onClick={() => { setAbierto(false); onEditar(producto); }} className={item} style={{ color: "#cbd1e0" }}>Editar</button>
            <button onClick={() => { setAbierto(false); onEliminar(producto); }} className={item} style={{ color: "#f87171" }}>Eliminar</button>
          </div>
        </>
      )}
    </div>
  );
}

const POR_PAGINA = 15;

export default function ProductosTabla({ productos, esAdmin, onEditar, onEliminar }) {
  const [orden, setOrden] = useState({ campo: "nombre", dir: "asc" });
  const [pagina, setPagina] = useState(1);

  function ordenarPor(campo) {
    setOrden((prev) => ({
      campo,
      dir: prev.campo === campo && prev.dir === "asc" ? "desc" : "asc"
    }));
    setPagina(1);
  }

  const ordenados = [...productos].sort((a, b) => {
    let va, vb;
    switch (orden.campo) {
      case "precio": va = Number(a.precio); vb = Number(b.precio); break;
      case "stock": va = Number(a.stock); vb = Number(b.stock); break;
      case "vencimiento": va = new Date(a.vencimiento); vb = new Date(b.vencimiento); break;
      case "sucursal": va = a.sucursal?.nombre || ""; vb = b.sucursal?.nombre || ""; break;
      case "categoria": va = a.categoria || ""; vb = b.categoria || ""; break;
      default: va = (a.nombre || "").toLowerCase(); vb = (b.nombre || "").toLowerCase();
    }
    if (va < vb) return orden.dir === "asc" ? -1 : 1;
    if (va > vb) return orden.dir === "asc" ? 1 : -1;
    return 0;
  });

  const totalPaginas = Math.ceil(ordenados.length / POR_PAGINA) || 1;
  const paginaActual = Math.min(pagina, totalPaginas);
  const desde = (paginaActual - 1) * POR_PAGINA;
  const visibles = ordenados.slice(desde, desde + POR_PAGINA);

  function Th({ campo, children, className = "" }) {
    const activo = orden.campo === campo;
    return (
      <th
        onClick={() => ordenarPor(campo)}
        className={"cursor-pointer select-none px-4 py-3 transition-colors hover:text-slate-300 " + className}
      >
        <span className="inline-flex items-center gap-1">
          {children}
          {activo && <span className="text-brand-400">{orden.dir === "asc" ? "▲" : "▼"}</span>}
        </span>
      </th>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-left text-xs uppercase text-slate-500">
            <tr>
              <Th campo="nombre">Producto</Th>
              <Th campo="categoria">Categoría</Th>
              {esAdmin && <Th campo="sucursal">Sucursal</Th>}
              <Th campo="stock" className="text-center">Stock</Th>
              <Th campo="precio" className="text-right">Precio</Th>
              <Th campo="vencimiento">Vence</Th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {visibles.map((p) => {
              const estado = obtenerEstado(p.vencimiento);
              const estadoStock = obtenerEstadoStock(p.stock);
              return (
                <tr key={p._id} className="bg-slate-950/50 transition-colors hover:bg-slate-900/50">
                  <td className="px-4 py-2.5 font-semibold text-white">
                    {p.nombre}
                    {p.lote && <span className="ml-2 text-[10px] text-slate-600">Lote {p.lote}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-slate-400">{p.categoria}</td>
                  {esAdmin && <td className="px-4 py-2.5 text-slate-400">{p.sucursal?.nombre || "—"}</td>}
                  <td className="px-4 py-2.5 text-center text-white">{p.stock}</td>
                  <td className="px-4 py-2.5 text-right text-white">${Number(p.precio).toLocaleString("es-AR")}</td>
                  <td className="px-4 py-2.5 text-slate-400">{formatearFecha(p.vencimiento)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      <span className={"rounded-full px-2 py-0.5 text-[10px] font-semibold " + estado.color}>{estado.texto}</span>
                      <span className={"rounded-full px-2 py-0.5 text-[10px] font-semibold " + estadoStock.color}>{estadoStock.texto}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end">
                      <MenuAcciones producto={p} onEditar={onEditar} onEliminar={onEliminar} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Página {paginaActual} de {totalPaginas} · {ordenados.length} productos
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={paginaActual === 1}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800 disabled:opacity-40"
            >
              ‹ Anterior
            </button>
            <button
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaActual === totalPaginas}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800 disabled:opacity-40"
            >
              Siguiente ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

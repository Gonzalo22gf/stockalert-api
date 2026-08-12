import { Input, Select } from "../../components/ui/Input";
import Boton from "../../components/ui/Boton";
import { exportarProductosExcel } from "../../lib/exportar";

const OPCIONES_ESTADO = [
  { value: "", label: "Todos los estados" },
  { value: "buen-estado", label: "En buen estado" },
  { value: "por-vencer", label: "Por vencer" },
  { value: "vencido", label: "Vencido" },
  { value: "stock-bajo", label: "Stock bajo" },
  { value: "agotado", label: "Agotado" }
];

const OPCIONES_ORDEN = [
  { value: "", label: "Ordenar por..." },
  { value: "alfabetico", label: "Nombre (A-Z)" },
  { value: "alfabetico-desc", label: "Nombre (Z-A)" },
  { value: "fecha", label: "Vence primero" },
  { value: "fecha-lejana", label: "Vence ultimo" },
  { value: "stock", label: "Stock (menor)" },
  { value: "stock-alto", label: "Stock (mayor)" },
  { value: "precio", label: "Precio (menor)" },
  { value: "precio-alto", label: "Precio (mayor)" }
];

export default function FiltrosProductos({
  filtros, setFiltro, limpiar, hayFiltrosActivos,
  categorias, productosFiltrados,
  vista, onCambiarVista,
  onImportar, inputImportarRef
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        <Input
          type="text"
          placeholder="Buscar por nombre, lote, EAN o sucursal..."
          value={filtros.busqueda}
          onChange={(e) => setFiltro("busqueda", e.target.value)}
          className="md:col-span-4"
        />
        <Select value={filtros.filtroCategoria} onChange={(e) => setFiltro("filtroCategoria", e.target.value)} className="md:col-span-3">
          <option value="">Todas las categorias</option>
          {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Select value={filtros.filtroEstado} onChange={(e) => setFiltro("filtroEstado", e.target.value)} className="md:col-span-3">
          {OPCIONES_ESTADO.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
        <Select value={filtros.orden} onChange={(e) => setFiltro("orden", e.target.value)} className="md:col-span-2">
          {OPCIONES_ORDEN.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
        <div className="flex flex-wrap items-center gap-2 md:col-span-6">
          <label className="text-xs text-slate-400 whitespace-nowrap">Vence desde:</label>
          <Input
            type="date"
            value={filtros.filtroFechaDesde}
            onChange={(e) => setFiltro("filtroFechaDesde", e.target.value)}
            className="flex-1"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 md:col-span-6">
          <label className="text-xs text-slate-400 whitespace-nowrap">Vence hasta:</label>
          <Input
            type="date"
            value={filtros.filtroFechaHasta}
            onChange={(e) => setFiltro("filtroFechaHasta", e.target.value)}
            className="flex-1"
          />
        </div>
        <div className="flex flex-wrap gap-2 md:col-span-12">
          <Boton variante="success" tamano="sm" onClick={() => exportarProductosExcel(productosFiltrados)} disabled={!productosFiltrados?.length}>
            Excel
          </Boton>
          <Boton variante="secondary" tamano="sm" onClick={onImportar}>
            Importar
          </Boton>
          {hayFiltrosActivos && (
            <Boton variante="ghost" tamano="sm" onClick={limpiar}>
              x Limpiar filtros
            </Boton>
          )}
          <div className="ml-auto flex overflow-hidden rounded-lg border border-slate-700">
            <button onClick={() => onCambiarVista("tabla")} className={"px-3 py-2 text-xs font-semibold transition-colors " + (vista === "tabla" ? "bg-brand text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700")}>Tabla</button>
            <button onClick={() => onCambiarVista("cards")} className={"px-3 py-2 text-xs font-semibold transition-colors " + (vista === "cards" ? "bg-brand text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700")}>Tarjetas</button>
          </div>
          <input ref={inputImportarRef} type="file" accept=".csv,.xlsx,.xls" onChange={onImportar} className="hidden" />
        </div>
      </div>
    </div>
  );
}

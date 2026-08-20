import { Input, Select } from "../../components/ui/Input";
import Boton from "../../components/ui/Boton";
import { exportarProductosExcel } from "../../lib/exportar";
import { useTranslation } from "react-i18next";

const OPCIONES_ESTADO = [
  { value: "", key: "filtros.estadoTodos" },
  { value: "buen-estado", key: "productos.buenEstado" },
  { value: "por-vencer", key: "productos.porVencer" },
  { value: "vencido", key: "productos.vencido" },
  { value: "stock-bajo", key: "filtros.stockBajo" },
  { value: "agotado", key: "filtros.agotado" }
];

const OPCIONES_ORDEN = [
  { value: "", key: "filtros.ordenarPor" },
  { value: "alfabetico", key: "filtros.nombreAZ" },
  { value: "alfabetico-desc", key: "filtros.nombreZA" },
  { value: "fecha", key: "filtros.vencePrimero" },
  { value: "fecha-lejana", key: "filtros.venceUltimo" },
  { value: "stock", key: "filtros.stockMenor" },
  { value: "stock-alto", key: "filtros.stockMayor" },
  { value: "precio", key: "filtros.precioMenor" },
  { value: "precio-alto", key: "filtros.precioMayor" }
];

export default function FiltrosProductos({
  filtros, setFiltro, limpiar, hayFiltrosActivos,
  categorias, productosFiltrados,
  vista, onCambiarVista,
  onImportar, inputImportarRef,
  seleccionados, onEliminarSeleccionados
}) {
  const { t } = useTranslation();
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
          <option value="">{t("filtros.todasCategorias")}</option>
          {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Select value={filtros.filtroEstado} onChange={(e) => setFiltro("filtroEstado", e.target.value)} className="md:col-span-3">
          {OPCIONES_ESTADO.map((o) => <option key={o.value} value={o.value}>{t(o.key)}</option>)}
        </Select>
        <Select value={filtros.orden} onChange={(e) => setFiltro("orden", e.target.value)} className="md:col-span-2">
          {OPCIONES_ORDEN.map((o) => <option key={o.value} value={o.value}>{t(o.key)}</option>)}
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
          {seleccionados?.length > 0 && (
            <Boton variante="danger" tamano="sm" onClick={onEliminarSeleccionados}>
              Eliminar {seleccionados.length} seleccionados
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

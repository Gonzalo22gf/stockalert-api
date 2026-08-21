import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuthStore } from "../auth/authStore";
import { useProductos, useEliminarProducto, useBulkDelete } from "./useProductos";
import { useSucursales } from "../sucursales/useSucursales";
import { useFiltradorProductos } from "./useFiltradorProductos";
import { useImportarProductos } from "./useImportarProductos";
import { CATEGORIAS } from "./productos.utils";
import FiltrosProductos from "./FiltrosProductos";
import FormularioProducto from "./FormularioProducto";
import ProductoCard from "./ProductoCard";
import ProductosTabla from "./ProductosTabla";
import ModalEditarProducto from "./ModalEditarProducto";
import EmptyState from "../../components/EmptyState";
import { SkeletonCards } from "../../components/Skeleton";
import { Select } from "../../components/ui/Input";
import Boton from "../../components/ui/Boton";

export default function ProductosPage() {
  const { t } = useTranslation();
  const usuario = useAuthStore((s) => s.usuario);
  const esAdmin = usuario?.rol === "admin";
  const [searchParams] = useSearchParams();
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState("");
  const [formAbierto, setFormAbierto] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [vista, setVista] = useState(() => {
    try { return localStorage.getItem("vistaProductos") || "tabla"; } catch { return "tabla"; }
  });

  useEffect(() => {
    const sucursalUrl = searchParams.get("sucursal");
    if (sucursalUrl && esAdmin) setSucursalSeleccionada(sucursalUrl);
  }, [searchParams, esAdmin]);

  const { data: sucursales } = useSucursales(esAdmin);
  const { data: productos, isLoading, isError } = useProductos(esAdmin ? sucursalSeleccionada : undefined);
  const eliminarProducto = useEliminarProducto();
  const bulkDelete = useBulkDelete();
  const { filtros, setFiltro, limpiar, hayFiltrosActivos, resultado, seleccionados, toggleSeleccion, toggleTodos, limpiarSeleccion } = useFiltradorProductos(productos);
  const { inputRef, abrirSelector, manejarArchivo } = useImportarProductos({ esAdmin, sucursalSeleccionada });

  const categoriasDisponibles = [...new Set([...CATEGORIAS, ...(productos || []).map((p) => p.categoria).filter(Boolean)])];

  function cambiarVista(v) {
    setVista(v);
    try { localStorage.setItem("vistaProductos", v); } catch {}
  }

  async function manejarEliminarSeleccionados() {
    const { isConfirmed } = await Swal.fire({
      title: t("swal.eliminarN", { n: seleccionados.length }),
      text: t("swal.permanente"),
      icon: "warning", showCancelButton: true,
      confirmButtonText: t("swal.siEliminarTodos"), cancelButtonText: t("productos.cancelar")
    });
    if (!isConfirmed) return;
    try {
      await bulkDelete.mutateAsync(seleccionados);
      limpiarSeleccion();
      Swal.fire({ icon: "success", title: t("swal.eliminados"), timer: 1300, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    }
  }

  async function manejarEliminar(producto) {
    const { isConfirmed } = await Swal.fire({
      title: t("swal.eliminarProducto"),
      text: t("swal.seEliminaPermanente", { nombre: producto.nombre }),
      icon: "warning", showCancelButton: true,
      confirmButtonText: t("swal.siEliminar"), cancelButtonText: t("productos.cancelar")
    });
    if (!isConfirmed) return;
    try {
      await eliminarProducto.mutateAsync(producto._id);
      Swal.fire({ icon: "success", title: t("swal.eliminado"), timer: 1300, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {esAdmin ? (
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-400">Sucursal</label>
            <Select value={sucursalSeleccionada} onChange={(e) => setSucursalSeleccionada(e.target.value)} className="w-auto">
              <option value="">{t("productos.todasSucursales")}</option>
              {(sucursales || []).map((s) => <option key={s._id} value={s._id}>{s.nombre}</option>)}
            </Select>
          </div>
        ) : <div />}
        <Boton onClick={() => setFormAbierto((v) => !v)}>
          {formAbierto ? "x Cerrar formulario" : "+ Agregar producto"}
        </Boton>
      </div>

      {formAbierto && <FormularioProducto esAdmin={esAdmin} />}

      <FiltrosProductos
        filtros={filtros}
        setFiltro={setFiltro}
        limpiar={limpiar}
        hayFiltrosActivos={hayFiltrosActivos}
        categorias={categoriasDisponibles}
        productosFiltrados={resultado}
        vista={vista}
        onCambiarVista={cambiarVista}
        onImportar={manejarArchivo}
        inputImportarRef={inputRef}
        seleccionados={seleccionados}
        onEliminarSeleccionados={manejarEliminarSeleccionados}
      />

      {isLoading && <SkeletonCards cantidad={8} />}
      {isError && <p className="text-sm text-red-400">No se pudieron cargar los productos.</p>}
      {!isLoading && !isError && (
        <>
          <p className="text-xs text-slate-500">Mostrando {resultado.length} de {productos?.length || 0} productos</p>
          {resultado.length === 0 ? (
            <EmptyState icono="📦" titulo={t("swal.sinProductos")} descripcion={t("swal.sinProductosDesc")} />
          ) : vista === "tabla" ? (
            <ProductosTabla productos={resultado} esAdmin={esAdmin} onEditar={setProductoEditando} onEliminar={manejarEliminar} seleccionados={seleccionados} onToggle={toggleSeleccion} onToggleTodos={toggleTodos} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {resultado.map((p) => <ProductoCard key={p._id} producto={p} esAdmin={esAdmin} onEditar={setProductoEditando} onEliminar={manejarEliminar} />)}
            </div>
          )}
        </>
      )}

      {productoEditando && <ModalEditarProducto producto={productoEditando} onCerrar={() => setProductoEditando(null)} />}
    </div>
  );
}

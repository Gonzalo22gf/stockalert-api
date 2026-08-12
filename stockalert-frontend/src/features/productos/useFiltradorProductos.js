import { useState, useCallback } from "react";
import { filtrarProductos, ordenarProductos } from "./productos.utils";

const ESTADO_INICIAL = { busqueda: "", filtroEstado: "", filtroCategoria: "", orden: "", filtroFechaDesde: "", filtroFechaHasta: "" };

export function useFiltradorProductos(productos) {
  const [filtros, setFiltros] = useState(ESTADO_INICIAL);

  function setFiltro(campo, valor) {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  }

  function limpiar() {
    setFiltros(ESTADO_INICIAL);
  }

  const [seleccionados, setSeleccionados] = useState([]);

  const toggleSeleccion = useCallback((id) => {
    setSeleccionados((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  }, []);

  const toggleTodos = useCallback((ids) => {
    setSeleccionados((prev) => prev.length === ids.length ? [] : ids);
  }, []);

  const limpiarSeleccion = useCallback(() => setSeleccionados([]), []);

  const hayFiltrosActivos = Object.values(filtros).some(Boolean);
  const filtrados = filtrarProductos(productos, filtros);
  const resultado = ordenarProductos(filtrados, filtros.orden);

  return { filtros, setFiltro, limpiar, hayFiltrosActivos, resultado, seleccionados, toggleSeleccion, toggleTodos, limpiarSeleccion };
}

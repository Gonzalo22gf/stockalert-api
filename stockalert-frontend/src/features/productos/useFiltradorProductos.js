import { useState } from "react";
import { filtrarProductos, ordenarProductos } from "./productos.utils";

const ESTADO_INICIAL = { busqueda: "", filtroEstado: "", filtroCategoria: "", orden: "" };

export function useFiltradorProductos(productos) {
  const [filtros, setFiltros] = useState(ESTADO_INICIAL);

  function setFiltro(campo, valor) {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  }

  function limpiar() {
    setFiltros(ESTADO_INICIAL);
  }

  const hayFiltrosActivos = Object.values(filtros).some(Boolean);
  const filtrados = filtrarProductos(productos, filtros);
  const resultado = ordenarProductos(filtrados, filtros.orden);

  return { filtros, setFiltro, limpiar, hayFiltrosActivos, resultado };
}

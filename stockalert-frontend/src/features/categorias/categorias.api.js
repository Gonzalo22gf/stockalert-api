import { apiGet, apiPost, apiPut, apiDelete } from "../../lib/client";
export const obtenerCategorias = () => apiGet("/api/categorias");
export const crearCategoria = (categoria) => apiPost("/api/categorias", categoria);
export const editarCategoria = (id, categoria) => apiPut(`/api/categorias/${id}`, categoria);
export const eliminarCategoria = (id, reasignarA) =>
  apiDelete(`/api/categorias/${id}`, reasignarA ? { reasignarA } : undefined);

import { apiGet, apiPost, apiPut, apiDelete } from "./client";

export const obtenerProductos = (sucursalId) =>
  apiGet(`/api/productos${sucursalId ? `?sucursal=${sucursalId}` : ""}`);

export const crearProducto = (producto) => apiPost("/api/productos", producto);

export const actualizarProducto = (id, producto) => apiPut(`/api/productos/${id}`, producto);

export const eliminarProducto = (id) => apiDelete(`/api/productos/${id}`);
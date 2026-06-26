import { apiGet, apiPost, apiPut, apiDelete } from "./client";

export const obtenerSucursales = () => apiGet("/api/sucursales");

export const obtenerResumenSucursales = () => apiGet("/api/sucursales/resumen");

export const crearSucursal = (sucursal) => apiPost("/api/sucursales", sucursal);

export const editarSucursal = (id, sucursal) => apiPut(`/api/sucursales/${id}`, sucursal);

export const eliminarSucursal = (id) => apiDelete(`/api/sucursales/${id}`);
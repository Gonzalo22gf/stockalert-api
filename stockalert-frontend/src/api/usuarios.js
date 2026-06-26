import { apiGet, apiPut, apiDelete } from "./client";

export const listarUsuarios = () => apiGet("/api/usuarios");

export const cambiarRol = (id, rol) => apiPut(`/api/usuarios/${id}/rol`, { rol });

export const cambiarEstado = (id, activo) => apiPut(`/api/usuarios/${id}/estado`, { activo });

export const cambiarSucursalUsuario = (id, numeroSucursal) =>
  apiPut(`/api/usuarios/${id}/sucursal`, { numeroSucursal });

export const editarUsuario = (id, datos) => apiPut(`/api/usuarios/${id}`, datos);

export const eliminarUsuario = (id) => apiDelete(`/api/usuarios/${id}`);
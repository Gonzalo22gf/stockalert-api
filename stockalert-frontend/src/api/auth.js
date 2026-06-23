import { apiPost, apiGet } from "./client";

export const login = (email, password) => apiPost("/api/usuarios/login", { email, password });

export const registrar = (nombre, email, password, numeroSucursal) =>
  apiPost("/api/usuarios/registro", { nombre, email, password, numeroSucursal });

export const obtenerPerfil = () => apiGet("/api/usuarios/perfil");
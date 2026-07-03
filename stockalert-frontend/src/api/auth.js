import { apiPost, apiGet } from "./client";

export const login = (email, password) => apiPost("/api/usuarios/login", { email, password });

export const registrar = (nombre, email, password, numeroSucursal) =>
  apiPost("/api/usuarios/registro", { nombre, email, password, numeroSucursal });

export const obtenerPerfil = () => apiGet("/api/usuarios/perfil");

// Recuperación de contraseña
export const olvidePassword = (email) => apiPost("/api/usuarios/olvide-password", { email });

export const restablecerPassword = (token, password) =>
  apiPost("/api/usuarios/restablecer-password", { token, password });

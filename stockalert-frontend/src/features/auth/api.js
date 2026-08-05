import { apiPost, apiGet } from "../../lib/client";

export const login = (email, password) => apiPost("/api/usuarios/login", { email, password });

// modo "crear": crea una empresa nueva y el usuario es su admin
// modo "unir": el usuario se une a una empresa existente como jefe de sucursal
export const registrar = ({ nombre, email, password, modo, nombreEmpresa, numeroSucursal }) =>
  apiPost("/api/usuarios/registro", { nombre, email, password, modo, nombreEmpresa, numeroSucursal });

export const obtenerPerfil = () => apiGet("/api/usuarios/perfil");
export const olvidePassword = (email) => apiPost("/api/usuarios/olvide-password", { email });
export const restablecerPassword = (token, password) =>
  apiPost("/api/usuarios/restablecer-password", { token, password });

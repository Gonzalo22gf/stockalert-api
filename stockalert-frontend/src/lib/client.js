import { PlanError } from "./PlanError";

const API_URL = import.meta.env.VITE_API_URL;

function obtenerToken() {
  return localStorage.getItem("tokenStockAlert") || "";
}

async function request(path, options = {}) {
  const token = obtenerToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };
  const respuesta = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    // Si el backend devuelve un codigo de limite de plan, lanzar PlanError
    if (data.codigo && ["LIMITE_PRODUCTOS","LIMITE_SUCURSALES","LIMITE_USUARIOS","TRIAL_EXPIRADO"].includes(data.codigo)) {
      throw new PlanError(data.mensaje, data.codigo);
    }
    throw new Error(data.mensaje || "Error en la solicitud");
  }
  return data;
}

export const apiGet    = (path)        => request(path, { method: "GET" });
export const apiPost   = (path, body)  => request(path, { method: "POST",   body: JSON.stringify(body) });
export const apiPut    = (path, body)  => request(path, { method: "PUT",    body: JSON.stringify(body) });
export const apiDelete = (path)        => request(path, { method: "DELETE" });

const API_URL = "https://stockalert-api.onrender.com";

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

  const respuesta = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  const data = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(data.mensaje || "Error en la solicitud");
  }

  return data;
}

export const apiGet = (path) => request(path, { method: "GET" });
export const apiPost = (path, body) => request(path, { method: "POST", body: JSON.stringify(body) });
export const apiPut = (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) });
export const apiDelete = (path) => request(path, { method: "DELETE" });
import { apiGet } from "./client";

export const obtenerMovimientos = (sucursalId) =>
  apiGet(`/api/movimientos${sucursalId ? `?sucursal=${sucursalId}` : ""}`);
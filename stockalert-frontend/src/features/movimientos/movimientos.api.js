import { apiGet } from "../../lib/client";

export const obtenerMovimientos = (sucursalId) =>
  apiGet(`/api/movimientos${sucursalId ? `?sucursal=${sucursalId}` : ""}`);
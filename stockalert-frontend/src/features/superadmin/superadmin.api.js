import { apiGet } from "../../lib/client";
export const obtenerMetricas = () => apiGet("/api/superadmin/metricas");
export const listarEmpresas  = () => apiGet("/api/superadmin/empresas");

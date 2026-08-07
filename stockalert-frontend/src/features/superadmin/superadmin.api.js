import { apiGet, apiDelete } from "../../lib/client";
import { apiPatch } from "../../lib/client";
export const obtenerMetricas  = () => apiGet("/api/superadmin/metricas");
export const listarEmpresas   = () => apiGet("/api/superadmin/empresas");
export const toggleEmpresa    = (id) => apiPatch("/api/superadmin/empresas/" + id + "/toggle");
export const eliminarEmpresa  = (id) => apiDelete("/api/superadmin/empresas/" + id);

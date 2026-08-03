import { apiGet } from "./client";
export const obtenerPerfilEmpresa = () => apiGet("/api/empresa/perfil");

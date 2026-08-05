import { apiGet } from "../../lib/client";
export const obtenerPerfilEmpresa = () => apiGet("/api/empresa/perfil");

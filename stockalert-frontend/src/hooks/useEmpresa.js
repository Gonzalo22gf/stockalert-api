import { useQuery } from "@tanstack/react-query";
import { obtenerPerfilEmpresa } from "../api/empresa";
export function usePerfilEmpresa() {
  return useQuery({ queryKey: ["empresa-perfil"], queryFn: obtenerPerfilEmpresa });
}

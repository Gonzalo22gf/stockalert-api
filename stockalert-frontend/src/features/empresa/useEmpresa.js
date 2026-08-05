import { useQuery } from "@tanstack/react-query";
import { obtenerPerfilEmpresa } from "./empresa.api";
export function usePerfilEmpresa() {
  return useQuery({ queryKey: ["empresa-perfil"], queryFn: obtenerPerfilEmpresa });
}

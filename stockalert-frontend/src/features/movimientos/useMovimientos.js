import { useQuery } from "@tanstack/react-query";
import { obtenerMovimientos } from "./movimientos.api";

export function useMovimientos(sucursalId) {
  return useQuery({
    queryKey: ["movimientos", sucursalId || "todas"],
    queryFn: () => obtenerMovimientos(sucursalId)
  });
}
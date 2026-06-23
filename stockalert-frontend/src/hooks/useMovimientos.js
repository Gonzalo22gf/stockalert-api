import { useQuery } from "@tanstack/react-query";
import { obtenerMovimientos } from "../api/movimientos";

export function useMovimientos(sucursalId) {
  return useQuery({
    queryKey: ["movimientos", sucursalId || "todas"],
    queryFn: () => obtenerMovimientos(sucursalId)
  });
}
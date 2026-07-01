import { useQuery } from "@tanstack/react-query";
import { obtenerHistorico } from "../api/snapshots";

// Trae el histórico completo de snapshots (opcionalmente entre fechas).
export function useSnapshots(desde, hasta, habilitado = true) {
  return useQuery({
    queryKey: ["snapshots", desde || "todo", hasta || "todo"],
    queryFn: () => obtenerHistorico(desde, hasta),
    enabled: habilitado
  });
}

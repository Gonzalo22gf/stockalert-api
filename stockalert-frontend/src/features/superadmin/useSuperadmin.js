import { useQuery } from "@tanstack/react-query";
import { obtenerMetricas, listarEmpresas } from "./superadmin.api";

export function useMetricasSuperadmin() {
  return useQuery({ queryKey: ["superadmin", "metricas"], queryFn: obtenerMetricas });
}

export function useEmpresasSuperadmin() {
  return useQuery({ queryKey: ["superadmin", "empresas"], queryFn: listarEmpresas });
}

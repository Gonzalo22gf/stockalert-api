import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { obtenerMetricas, listarEmpresas, toggleEmpresa, eliminarEmpresa } from "./superadmin.api";

export function useMetricasSuperadmin() {
  return useQuery({ queryKey: ["superadmin", "metricas"], queryFn: obtenerMetricas });
}

export function useEmpresasSuperadmin() {
  return useQuery({ queryKey: ["superadmin", "empresas"], queryFn: listarEmpresas });
}

export function useToggleEmpresa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: toggleEmpresa,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["superadmin", "empresas"] });
      qc.invalidateQueries({ queryKey: ["superadmin", "metricas"] });
    }
  });
}

export function useEliminarEmpresa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: eliminarEmpresa,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["superadmin", "empresas"] });
      qc.invalidateQueries({ queryKey: ["superadmin", "metricas"] });
    }
  });
}

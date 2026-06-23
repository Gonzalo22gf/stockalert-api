import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { obtenerSucursales, obtenerResumenSucursales, crearSucursal, editarSucursal } from "../api/sucursales";

export function useSucursales(habilitado = true) {
  return useQuery({
    queryKey: ["sucursales"],
    queryFn: obtenerSucursales,
    enabled: habilitado
  });
}

export function useResumenSucursales(habilitado = true) {
  return useQuery({
    queryKey: ["sucursales", "resumen"],
    queryFn: obtenerResumenSucursales,
    enabled: habilitado
  });
}

export function useCrearSucursal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: crearSucursal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sucursales"] });
    }
  });
}

export function useEditarSucursal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }) => editarSucursal(id, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sucursales"] });
    }
  });
}
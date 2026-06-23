import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { obtenerProductos, crearProducto, actualizarProducto, eliminarProducto } from "../api/productos";

export function useProductos(sucursalId) {
  return useQuery({
    queryKey: ["productos", sucursalId || "todas"],
    queryFn: () => obtenerProductos(sucursalId)
  });
}

export function useCrearProducto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: crearProducto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      queryClient.invalidateQueries({ queryKey: ["sucursales", "resumen"] });
      queryClient.invalidateQueries({ queryKey: ["movimientos"] });
    }
  });
}

export function useActualizarProducto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }) => actualizarProducto(id, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      queryClient.invalidateQueries({ queryKey: ["sucursales", "resumen"] });
      queryClient.invalidateQueries({ queryKey: ["movimientos"] });
    }
  });
}

export function useEliminarProducto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: eliminarProducto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      queryClient.invalidateQueries({ queryKey: ["sucursales", "resumen"] });
      queryClient.invalidateQueries({ queryKey: ["movimientos"] });
    }
  });
}
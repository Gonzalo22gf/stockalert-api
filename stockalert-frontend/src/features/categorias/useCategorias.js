import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { obtenerCategorias, crearCategoria, editarCategoria, eliminarCategoria } from "./categorias.api";
export function useCategorias(habilitado = true) {
  return useQuery({
    queryKey: ["categorias"],
    queryFn: obtenerCategorias,
    enabled: habilitado
  });
}
export function useCrearCategoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: crearCategoria,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
    }
  });
}
export function useEditarCategoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }) => editarCategoria(id, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      queryClient.invalidateQueries({ queryKey: ["productos"] });
    }
  });
}
export function useEliminarCategoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reasignarA }) => eliminarCategoria(id, reasignarA),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      queryClient.invalidateQueries({ queryKey: ["productos"] });
    }
  });
}

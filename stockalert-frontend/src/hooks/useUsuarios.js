import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listarUsuarios, cambiarRol, cambiarEstado, cambiarSucursalUsuario, editarUsuario } from "../api/usuarios";

export function useUsuarios(habilitado = true) {
  return useQuery({
    queryKey: ["usuarios"],
    queryFn: listarUsuarios,
    enabled: habilitado
  });
}

export function useCambiarRol() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rol }) => cambiarRol(id, rol),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["usuarios"] })
  });
}

export function useCambiarEstado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, activo }) => cambiarEstado(id, activo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["usuarios"] })
  });
}

export function useCambiarSucursalUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, numeroSucursal }) => cambiarSucursalUsuario(id, numeroSucursal),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["usuarios"] })
  });
}

export function useEditarUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }) => editarUsuario(id, datos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["usuarios"] })
  });
}
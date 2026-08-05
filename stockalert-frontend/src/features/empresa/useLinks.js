import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "../../lib/client";

export function useLinks() {
  return useQuery({ queryKey: ["links"], queryFn: () => apiGet("/api/links") });
}

export function useCrearLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (datos) => apiPost("/api/links", datos),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["links"] })
  });
}

export function useEditarLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }) => apiPut("/api/links/" + id, datos),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["links"] })
  });
}

export function useBorrarLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiDelete("/api/links/" + id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["links"] })
  });
}

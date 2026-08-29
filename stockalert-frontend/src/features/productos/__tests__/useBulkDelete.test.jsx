// @vitest-environment jsdom
import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Mockeamos la capa API: el hook no debe pegarle a la red de verdad.
vi.mock("../productos.api", () => ({
  obtenerProductos: vi.fn(),
  crearProducto: vi.fn(),
  actualizarProducto: vi.fn(),
  eliminarProducto: vi.fn(),
  eliminarVariosProductos: vi.fn()
}));

import { eliminarVariosProductos } from "../productos.api";
import { useBulkDelete } from "../useProductos";

function crearWrapper() {
  // QueryClient nuevo por test, sin reintentos (para que el error sea inmediato).
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } });
  const spyInvalidate = vi.spyOn(queryClient, "invalidateQueries");
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { wrapper, spyInvalidate };
}

describe("useBulkDelete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("llama a eliminarVariosProductos con los ids que recibe", async () => {
    eliminarVariosProductos.mockResolvedValue({ eliminados: 2 });
    const { wrapper } = crearWrapper();
    const { result } = renderHook(() => useBulkDelete(), { wrapper });

    await result.current.mutateAsync(["id1", "id2"]);

    expect(eliminarVariosProductos).toHaveBeenCalledTimes(1);
    expect(eliminarVariosProductos).toHaveBeenCalledWith(["id1", "id2"]);
  });

  test("al terminar bien, invalida los 3 caches (productos, sucursales/resumen, movimientos)", async () => {
    eliminarVariosProductos.mockResolvedValue({ eliminados: 1 });
    const { wrapper, spyInvalidate } = crearWrapper();
    const { result } = renderHook(() => useBulkDelete(), { wrapper });

    await result.current.mutateAsync(["id1"]);

    const claves = spyInvalidate.mock.calls.map((c) => JSON.stringify(c[0].queryKey));
    expect(claves).toContain(JSON.stringify(["productos"]));
    expect(claves).toContain(JSON.stringify(["sucursales", "resumen"]));
    expect(claves).toContain(JSON.stringify(["movimientos"]));
  });

  test("si la API falla, la mutation propaga el error y NO invalida el cache", async () => {
    eliminarVariosProductos.mockRejectedValue(new Error("fallo del server"));
    const { wrapper, spyInvalidate } = crearWrapper();
    const { result } = renderHook(() => useBulkDelete(), { wrapper });

    await expect(result.current.mutateAsync(["id1"])).rejects.toThrow("fallo del server");
    expect(spyInvalidate).not.toHaveBeenCalled();
  });

  test("expone el estado de la mutation (isPending arranca en false)", () => {
    const { wrapper } = crearWrapper();
    const { result } = renderHook(() => useBulkDelete(), { wrapper });
    expect(result.current.isPending).toBe(false);
    expect(typeof result.current.mutateAsync).toBe("function");
  });
});

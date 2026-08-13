// @vitest-environment jsdom
import { describe, test, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFiltradorProductos } from "../useFiltradorProductos";

const productos = [
  { _id: "a", nombre: "Leche", categoria: "Lacteos", stock: 5, precio: 100, vencimiento: "2027-01-01" },
  { _id: "b", nombre: "Agua",  categoria: "Bebidas", stock: 3, precio: 50,  vencimiento: "2027-01-01" },
  { _id: "c", nombre: "Arroz", categoria: "Almacen", stock: 9, precio: 200, vencimiento: "2027-01-01" }
];

describe("useFiltradorProductos - seleccion", () => {
  test("arranca sin nada seleccionado", () => {
    const { result } = renderHook(() => useFiltradorProductos(productos));
    expect(result.current.seleccionados).toEqual([]);
  });

  test("toggleSeleccion agrega y despues saca el mismo id", () => {
    const { result } = renderHook(() => useFiltradorProductos(productos));
    act(() => result.current.toggleSeleccion("a"));
    expect(result.current.seleccionados).toEqual(["a"]);
    act(() => result.current.toggleSeleccion("a"));
    expect(result.current.seleccionados).toEqual([]);
  });

  test("toggleSeleccion acumula varios ids", () => {
    const { result } = renderHook(() => useFiltradorProductos(productos));
    act(() => result.current.toggleSeleccion("a"));
    act(() => result.current.toggleSeleccion("b"));
    expect(result.current.seleccionados).toEqual(["a", "b"]);
  });

  test("toggleTodos selecciona todos cuando no hay ninguno", () => {
    const { result } = renderHook(() => useFiltradorProductos(productos));
    act(() => result.current.toggleTodos(["a", "b", "c"]));
    expect(result.current.seleccionados).toEqual(["a", "b", "c"]);
  });

  test("toggleTodos deselecciona todos cuando ya estan todos", () => {
    const { result } = renderHook(() => useFiltradorProductos(productos));
    act(() => result.current.toggleTodos(["a", "b", "c"]));
    act(() => result.current.toggleTodos(["a", "b", "c"]));
    expect(result.current.seleccionados).toEqual([]);
  });

  test("limpiarSeleccion vacia la seleccion", () => {
    const { result } = renderHook(() => useFiltradorProductos(productos));
    act(() => result.current.toggleSeleccion("a"));
    act(() => result.current.toggleSeleccion("b"));
    act(() => result.current.limpiarSeleccion());
    expect(result.current.seleccionados).toEqual([]);
  });
});

describe("useFiltradorProductos - filtros", () => {
  test("setFiltro por categoria reduce el resultado", () => {
    const { result } = renderHook(() => useFiltradorProductos(productos));
    act(() => result.current.setFiltro("filtroCategoria", "Bebidas"));
    expect(result.current.resultado).toHaveLength(1);
    expect(result.current.resultado[0].nombre).toBe("Agua");
  });

  test("hayFiltrosActivos refleja si hay algun filtro puesto", () => {
    const { result } = renderHook(() => useFiltradorProductos(productos));
    expect(result.current.hayFiltrosActivos).toBe(false);
    act(() => result.current.setFiltro("busqueda", "Leche"));
    expect(result.current.hayFiltrosActivos).toBe(true);
  });

  test("limpiar resetea todos los filtros", () => {
    const { result } = renderHook(() => useFiltradorProductos(productos));
    act(() => result.current.setFiltro("filtroCategoria", "Bebidas"));
    act(() => result.current.limpiar());
    expect(result.current.hayFiltrosActivos).toBe(false);
    expect(result.current.resultado).toHaveLength(3);
  });
});

import { describe, test, expect } from "vitest";
import { estadoVencimiento, filtrarProductos, ordenarProductos } from "../productos.utils";

// Fechas relativas a hoy para que los tests no caduquen
const enDias = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
};

const productos = [
  { nombre: "Leche",   categoria: "Lacteos", stock: 5,  precio: 100, vencimiento: enDias(-3),  lote: "L1", codigoBarras: "779111" },
  { nombre: "Agua",    categoria: "Bebidas", stock: 0,  precio: 50,  vencimiento: enDias(3),   lote: "L2", codigoBarras: "779222" },
  { nombre: "Arroz",   categoria: "Almacen", stock: 40, precio: 200, vencimiento: enDias(90),  lote: "L3", codigoBarras: "779333" }
];

const sinFiltro = { busqueda: "", filtroEstado: "", filtroCategoria: "", filtroFechaDesde: "", filtroFechaHasta: "" };

describe("estadoVencimiento", () => {
  test("fecha pasada es vencido", () => {
    expect(estadoVencimiento(enDias(-1))).toBe("vencido");
  });
  test("dentro de 7 dias es por-vencer", () => {
    expect(estadoVencimiento(enDias(3))).toBe("por-vencer");
  });
  test("mas de 7 dias es buen-estado", () => {
    expect(estadoVencimiento(enDias(30))).toBe("buen-estado");
  });
});

describe("filtrarProductos", () => {
  test("sin filtros devuelve todos", () => {
    expect(filtrarProductos(productos, sinFiltro)).toHaveLength(3);
  });

  test("lista vacia o undefined no explota", () => {
    expect(filtrarProductos(undefined, sinFiltro)).toEqual([]);
    expect(filtrarProductos([], sinFiltro)).toEqual([]);
  });

  test("filtro vencido devuelve solo el vencido", () => {
    const r = filtrarProductos(productos, { ...sinFiltro, filtroEstado: "vencido" });
    expect(r).toHaveLength(1);
    expect(r[0].nombre).toBe("Leche");
  });

  test("filtro agotado devuelve solo stock 0", () => {
    const r = filtrarProductos(productos, { ...sinFiltro, filtroEstado: "agotado" });
    expect(r).toHaveLength(1);
    expect(r[0].nombre).toBe("Agua");
  });

  test("filtro stock-bajo excluye agotados y sobre-stockeados", () => {
    const r = filtrarProductos(productos, { ...sinFiltro, filtroEstado: "stock-bajo" });
    expect(r.map((p) => p.nombre)).toEqual(["Leche"]);
  });

  test("filtro por categoria", () => {
    const r = filtrarProductos(productos, { ...sinFiltro, filtroCategoria: "Bebidas" });
    expect(r).toHaveLength(1);
    expect(r[0].nombre).toBe("Agua");
  });

  test("busqueda por nombre es case-insensitive", () => {
    expect(filtrarProductos(productos, { ...sinFiltro, busqueda: "LECHE" })).toHaveLength(1);
  });

  test("busqueda por codigo de barras", () => {
    const r = filtrarProductos(productos, { ...sinFiltro, busqueda: "779222" });
    expect(r[0].nombre).toBe("Agua");
  });

  test("filtros combinados: categoria + estado", () => {
    const r = filtrarProductos(productos, { ...sinFiltro, filtroCategoria: "Lacteos", filtroEstado: "vencido" });
    expect(r).toHaveLength(1);
  });

  test("combinacion sin coincidencias devuelve vacio", () => {
    const r = filtrarProductos(productos, { ...sinFiltro, filtroCategoria: "Bebidas", filtroEstado: "vencido" });
    expect(r).toHaveLength(0);
  });
});

describe("ordenarProductos", () => {
  test("sin orden devuelve la lista igual", () => {
    expect(ordenarProductos(productos, "")).toHaveLength(3);
  });

  test("orden alfabetico", () => {
    const r = ordenarProductos(productos, "alfabetico");
    expect(r.map((p) => p.nombre)).toEqual(["Agua", "Arroz", "Leche"]);
  });

  test("orden por precio ascendente", () => {
    const r = ordenarProductos(productos, "precio");
    expect(r[0].nombre).toBe("Agua");
    expect(r[2].nombre).toBe("Arroz");
  });

  test("no muta el array original", () => {
    const copia = [...productos];
    ordenarProductos(productos, "alfabetico");
    expect(productos).toEqual(copia);
  });
});

describe("filtrarProductos - rango de fechas de vencimiento", () => {
  const base = [
    { nombre: "Vence pronto", categoria: "Bebidas", stock: 5, precio: 10, vencimiento: enDias(2),  lote: "", codigoBarras: "" },
    { nombre: "Vence medio",  categoria: "Bebidas", stock: 5, precio: 10, vencimiento: enDias(15), lote: "", codigoBarras: "" },
    { nombre: "Vence lejos",  categoria: "Bebidas", stock: 5, precio: 10, vencimiento: enDias(60), lote: "", codigoBarras: "" }
  ];

  test("filtroFechaDesde excluye lo que vence antes de esa fecha", () => {
    const r = filtrarProductos(base, { ...sinFiltro, filtroFechaDesde: enDias(10) });
    expect(r.map((p) => p.nombre)).toEqual(["Vence medio", "Vence lejos"]);
  });

  test("filtroFechaHasta excluye lo que vence despues de esa fecha", () => {
    const r = filtrarProductos(base, { ...sinFiltro, filtroFechaHasta: enDias(20) });
    expect(r.map((p) => p.nombre)).toEqual(["Vence pronto", "Vence medio"]);
  });

  test("rango desde+hasta devuelve solo lo que cae dentro", () => {
    const r = filtrarProductos(base, { ...sinFiltro, filtroFechaDesde: enDias(10), filtroFechaHasta: enDias(30) });
    expect(r).toHaveLength(1);
    expect(r[0].nombre).toBe("Vence medio");
  });

  test("filtroFechaHasta incluye productos que vencen ese mismo dia", () => {
    // el codigo agrega T23:59:59 al limite, asi que un producto que vence ese dia entra
    const r = filtrarProductos(base, { ...sinFiltro, filtroFechaHasta: enDias(2) });
    expect(r.map((p) => p.nombre)).toContain("Vence pronto");
  });

  test("rango imposible (hasta antes que desde) devuelve vacio", () => {
    const r = filtrarProductos(base, { ...sinFiltro, filtroFechaDesde: enDias(40), filtroFechaHasta: enDias(10) });
    expect(r).toHaveLength(0);
  });

  test("rango de fechas se combina con filtro de categoria", () => {
    const mixto = [
      ...base,
      { nombre: "Otra cat", categoria: "Lacteos", stock: 5, precio: 10, vencimiento: enDias(15), lote: "", codigoBarras: "" }
    ];
    const r = filtrarProductos(mixto, { ...sinFiltro, filtroCategoria: "Bebidas", filtroFechaDesde: enDias(10), filtroFechaHasta: enDias(30) });
    expect(r.map((p) => p.nombre)).toEqual(["Vence medio"]);
  });
});

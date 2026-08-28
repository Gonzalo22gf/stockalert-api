import { useMemo } from "react";

// Toda la logica de calculo de los graficos del dashboard, separada del render.
// Recibe los productos y el resumen por sucursal; devuelve los datos ya computados.
export function useDatosGraficos(productos, resumenSucursales) {
  return useMemo(() => {
    const lista = productos || [];
    const hoy = new Date();

    // Estado de productos (para la dona): buen estado / por vencer / vencidos / no vence
    let enBuenEstado = 0, porVencer = 0, vencidos = 0, noVence = 0;
    lista.forEach((p) => {
      if (p.vence === false) { noVence++; return; }
      const dias = Math.ceil((new Date(p.vencimiento) - hoy) / (1000 * 60 * 60 * 24));
      if (dias < 0) vencidos++;
      else if (dias <= 7) porVencer++;
      else enBuenEstado++;
    });
    const total = lista.length;

    // Agregados por categoria: cantidad, stock y valor
    const porCategoria = {};
    const stockPorCategoria = {};
    const valorPorCategoria = {};
    lista.forEach((p) => {
      porCategoria[p.categoria] = (porCategoria[p.categoria] || 0) + 1;
      stockPorCategoria[p.categoria] = (stockPorCategoria[p.categoria] || 0) + Number(p.stock || 0);
      valorPorCategoria[p.categoria] = (valorPorCategoria[p.categoria] || 0) + Number(p.stock || 0) * Number(p.precio || 0);
    });
    const categorias = Object.keys(porCategoria);

    // Rankings por sucursal (solo si el admin ve el resumen global)
    const hayResumen = resumenSucursales && resumenSucursales.length > 0;
    const topVencidos = hayResumen
      ? [...resumenSucursales].filter((r) => r.vencidos > 0).sort((a, b) => b.vencidos - a.vencidos).slice(0, 10)
      : [];
    const topPorVencer = hayResumen
      ? [...resumenSucursales].filter((r) => r.porVencer > 0).sort((a, b) => b.porVencer - a.porVencer).slice(0, 10)
      : [];
    const topRiesgo = hayResumen
      ? [...resumenSucursales]
          .map((r) => ({ nombre: r.sucursal.nombre, riesgo: r.vencidos + r.porVencer + r.stockCritico }))
          .filter((r) => r.riesgo > 0)
          .sort((a, b) => b.riesgo - a.riesgo)
          .slice(0, 10)
      : [];

    // Top 10 productos con menos stock (siempre, no depende del resumen)
    const topStockBajo = [...lista]
      .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0))
      .slice(0, 10);

    return {
      total, enBuenEstado, porVencer, vencidos, noVence,
      porCategoria, stockPorCategoria, valorPorCategoria, categorias,
      hayResumen, topVencidos, topPorVencer, topRiesgo, topStockBajo
    };
  }, [productos, resumenSucursales]);
}

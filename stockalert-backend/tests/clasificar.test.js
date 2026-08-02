const { clasificar } = require("../controllers/alertas.controller");

// Helper: devuelve una fecha a N dias de hoy (negativo = pasado)
function diasDesdeHoy(n) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + n);
  return fecha;
}

describe("clasificar (logica de alertas)", () => {
  test("un producto vencido ayer va a vencidos", () => {
    const r = clasificar([{ nombre: "Leche", vencimiento: diasDesdeHoy(-1), stock: 10 }]);
    expect(r.vencidos.length).toBe(1);
    expect(r.porVencer.length).toBe(0);
  });

  test("un producto que vence en 3 dias va a porVencer", () => {
    const r = clasificar([{ nombre: "Yogur", vencimiento: diasDesdeHoy(3), stock: 10 }]);
    expect(r.porVencer.length).toBe(1);
    expect(r.vencidos.length).toBe(0);
  });

  test("un producto que vence en 30 dias no va a ninguna lista de vencimiento", () => {
    const r = clasificar([{ nombre: "Fideos", vencimiento: diasDesdeHoy(30), stock: 10 }]);
    expect(r.vencidos.length).toBe(0);
    expect(r.porVencer.length).toBe(0);
  });

  test("un producto con stock 0 va a agotados", () => {
    const r = clasificar([{ nombre: "Azucar", vencimiento: diasDesdeHoy(30), stock: 0 }]);
    expect(r.agotados.length).toBe(1);
    expect(r.stockCritico.length).toBe(0);
  });

  test("un producto con stock 3 va a stockCritico", () => {
    const r = clasificar([{ nombre: "Sal", vencimiento: diasDesdeHoy(30), stock: 3 }]);
    expect(r.stockCritico.length).toBe(1);
    expect(r.agotados.length).toBe(0);
  });

  test("un producto con stock 10 no es critico ni agotado", () => {
    const r = clasificar([{ nombre: "Arroz", vencimiento: diasDesdeHoy(30), stock: 10 }]);
    expect(r.stockCritico.length).toBe(0);
    expect(r.agotados.length).toBe(0);
  });

  test("una lista vacia devuelve todas las categorias vacias", () => {
    const r = clasificar([]);
    expect(r.vencidos.length).toBe(0);
    expect(r.porVencer.length).toBe(0);
    expect(r.stockCritico.length).toBe(0);
    expect(r.agotados.length).toBe(0);
  });

  test("un producto vencido y sin stock aparece en vencidos y en agotados a la vez", () => {
    const r = clasificar([{ nombre: "Queso", vencimiento: diasDesdeHoy(-5), stock: 0 }]);
    expect(r.vencidos.length).toBe(1);
    expect(r.agotados.length).toBe(1);
  });

  test("clasifica bien una lista mixta de productos", () => {
    const r = clasificar([
      { nombre: "A", vencimiento: diasDesdeHoy(-2), stock: 10 },
      { nombre: "B", vencimiento: diasDesdeHoy(2), stock: 10 },
      { nombre: "C", vencimiento: diasDesdeHoy(60), stock: 0 },
      { nombre: "D", vencimiento: diasDesdeHoy(60), stock: 2 }
    ]);
    expect(r.vencidos.length).toBe(1);
    expect(r.porVencer.length).toBe(1);
    expect(r.agotados.length).toBe(1);
    expect(r.stockCritico.length).toBe(1);
  });
});

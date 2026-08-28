const { estaVencido, estaPorVencer } = require("../utils/clasificarVencimiento");

function fechaEnDias(dias) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString();
}

describe("estaVencido", () => {
  test("un producto con fecha pasada esta vencido", () => {
    expect(estaVencido({ vencimiento: fechaEnDias(-1) })).toBe(true);
  });
  test("un producto con fecha futura no esta vencido", () => {
    expect(estaVencido({ vencimiento: fechaEnDias(10) })).toBe(false);
  });
  test("un producto con vence:false nunca esta vencido, aunque la fecha sea pasada", () => {
    expect(estaVencido({ vence: false, vencimiento: fechaEnDias(-5) })).toBe(false);
  });
});

describe("estaPorVencer", () => {
  test("un producto que vence en 3 dias esta por vencer", () => {
    expect(estaPorVencer({ vencimiento: fechaEnDias(3) })).toBe(true);
  });
  test("un producto que vence en 30 dias no esta por vencer", () => {
    expect(estaPorVencer({ vencimiento: fechaEnDias(30) })).toBe(false);
  });
  test("un producto ya vencido no esta por vencer (mutuamente excluyente)", () => {
    expect(estaPorVencer({ vencimiento: fechaEnDias(-2) })).toBe(false);
  });
  test("un producto con vence:false nunca esta por vencer", () => {
    expect(estaPorVencer({ vence: false, vencimiento: fechaEnDias(2) })).toBe(false);
  });
  test("respeta el umbral de dias personalizado", () => {
    expect(estaPorVencer({ vencimiento: fechaEnDias(10) }, 14)).toBe(true);
  });
});

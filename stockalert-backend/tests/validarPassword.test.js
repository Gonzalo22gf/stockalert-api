const { validarPassword } = require("../utils/validarPassword");

describe("validarPassword", () => {
  test("acepta una contrasena valida con todo lo requerido", () => {
    expect(validarPassword("Abcdef1!")).toBeNull();
  });

  test("acepta otra contrasena valida mas larga", () => {
    expect(validarPassword("MiClaveSegura2024#")).toBeNull();
  });

  test("rechaza una contrasena de menos de 8 caracteres", () => {
    expect(validarPassword("Ab1!")).toMatch(/8 caracteres/);
  });

  test("rechaza si no tiene mayuscula", () => {
    expect(validarPassword("abcdef1!")).toMatch(/may/);
  });

  test("rechaza si no tiene numero", () => {
    expect(validarPassword("Abcdefg!")).toMatch(/n/);
  });

  test("rechaza si no tiene simbolo", () => {
    expect(validarPassword("Abcdefg1")).toMatch(/s/);
  });

  test("rechaza un valor que no es string", () => {
    expect(validarPassword(undefined)).toMatch(/8 caracteres/);
  });

  test("rechaza un string vacio", () => {
    expect(validarPassword("")).toMatch(/8 caracteres/);
  });
});

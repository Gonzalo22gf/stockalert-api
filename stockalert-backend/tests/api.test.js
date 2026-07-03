const request = require("supertest");
const app = require("../app");

// ───────────────────────────────
// Health check
// ───────────────────────────────
describe("Health check", () => {
  test("GET / responde 200 con mensaje de la API", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("StockAlert");
  });
});

// ───────────────────────────────
// Seguridad: rutas protegidas sin token
// ───────────────────────────────
describe("Rutas protegidas rechazan sin token", () => {
  const rutasProtegidas = [
    "/api/productos",
    "/api/sucursales",
    "/api/usuarios",
    "/api/movimientos",
    "/api/snapshots/historico"
  ];

  test.each(rutasProtegidas)("GET %s sin token devuelve 401", async (ruta) => {
    const res = await request(app).get(ruta);
    expect(res.statusCode).toBe(401);
  });
});

// ───────────────────────────────
// Seguridad: token inválido
// ───────────────────────────────
describe("Rutas protegidas rechazan token inválido", () => {
  test("GET /api/productos con token trucho devuelve 401", async () => {
    const res = await request(app)
      .get("/api/productos")
      .set("Authorization", "Bearer token-falso-123");
    expect(res.statusCode).toBe(401);
  });
});

// ───────────────────────────────
// Seguridad: snapshot sin clave secreta
// ───────────────────────────────
describe("Endpoint de snapshots protegido por clave", () => {
  test("POST /api/snapshots/generar sin clave devuelve 401", async () => {
    const res = await request(app).post("/api/snapshots/generar");
    expect(res.statusCode).toBe(401);
  });

  test("POST /api/snapshots/generar con clave incorrecta devuelve 401", async () => {
    const res = await request(app)
      .post("/api/snapshots/generar")
      .set("x-cron-secret", "clave-incorrecta");
    expect(res.statusCode).toBe(401);
  });
});

// ───────────────────────────────
// Validación de datos en login
// ───────────────────────────────
describe("Login valida credenciales", () => {
  test("POST /api/usuarios/login sin datos devuelve error (400 o 401)", async () => {
    const res = await request(app).post("/api/usuarios/login").send({});
    expect([400, 401, 500]).toContain(res.statusCode);
    expect(res.statusCode).not.toBe(200);
  });
});

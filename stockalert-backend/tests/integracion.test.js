const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const app = require("../app");
const Usuario = require("../models/Usuario");
const Empresa = require("../models/Empresa");
const Sucursal = require("../models/Sucursal");
const Snapshot = require("../models/Snapshot");
const Suscripcion = require("../models/Suscripcion");

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe("Snapshots - acceso", () => {
  test("snapshot sin clave secreta devuelve 401", async () => {
    const res = await request(app).post("/api/snapshots/generar");
    expect(res.statusCode).toBe(401);
  });

  test("historico requiere autenticacion", async () => {
    const res = await request(app).get("/api/snapshots/historico");
    expect(res.statusCode).toBe(401);
  });

  test("clave incorrecta devuelve 401", async () => {
    const res = await request(app).post("/api/snapshots/generar").set("x-cron-secret", "incorrecta");
    expect(res.statusCode).toBe(401);
  });
});

describe("Push notifications - acceso", () => {
  test("suscribir requiere autenticacion", async () => {
    const res = await request(app).post("/api/push/suscribir").send({ token: "tokenvalido12345678" });
    expect(res.statusCode).toBe(401);
  });

  test("desuscribir requiere autenticacion", async () => {
    const res = await request(app).post("/api/push/desuscribir").send({ token: "tokenvalido12345678" });
    expect(res.statusCode).toBe(401);
  });
});

describe("Empresa - acceso", () => {
  test("perfil requiere autenticacion", async () => {
    const res = await request(app).get("/api/empresa/perfil");
    expect(res.statusCode).toBe(401);
  });
});

describe("Superadmin - acceso", () => {
  test("metricas requiere autenticacion", async () => {
    const res = await request(app).get("/api/superadmin/metricas");
    expect(res.statusCode).toBe(401);
  });

  test("empresas requiere autenticacion", async () => {
    const res = await request(app).get("/api/superadmin/empresas");
    expect(res.statusCode).toBe(401);
  });

  test("toggle requiere autenticacion", async () => {
    const res = await request(app).patch("/api/superadmin/empresas/123/toggle");
    expect(res.statusCode).toBe(401);
  });

  test("eliminar empresa requiere autenticacion", async () => {
    const res = await request(app).delete("/api/superadmin/empresas/123");
    expect(res.statusCode).toBe(401);
  });
});

describe("Lemon Squeezy - acceso", () => {
  test("checkout requiere autenticacion", async () => {
    const res = await request(app).post("/api/lemon/checkout").send({ plan: "starter" });
    expect(res.statusCode).toBe(401);
  });

  test("webhook sin firma devuelve error", async () => {
    const res = await request(app).post("/api/lemon/webhook").send({ meta: { event_name: "order_created" } });
    expect([400, 500]).toContain(res.statusCode);
  });
});

describe("Recuperacion - validaciones", () => {
  test("restablecer sin token devuelve 400", async () => {
    const res = await request(app).post("/api/usuarios/restablecer-password").send({ password: "Nueva123!" });
    expect(res.statusCode).toBe(400);
  });

  test("restablecer con token invalido devuelve 400", async () => {
    const res = await request(app).post("/api/usuarios/restablecer-password").send({ token: "invalido999", password: "Nueva123!" });
    expect(res.statusCode).toBe(400);
  });

  test("restablecer con clave debil devuelve 400", async () => {
    const res = await request(app).post("/api/usuarios/restablecer-password").send({ token: "cualquier", password: "debil" });
    expect(res.statusCode).toBe(400);
  });

  test("flujo completo con token valido", async () => {
    const empresa = await Empresa.create({ nombre: "RecupEmpresa" });
    const sucursal = await Sucursal.create({ zona: 1, numero: 1, empresa: empresa._id });
    const hash = await bcrypt.hash("Clave123!", 10);
    const tokenPlano = "tokenrecuperacionflujo123abc";
    const tokenHasheado = crypto.createHash("sha256").update(tokenPlano).digest("hex");
    await Usuario.create({ nombre: "Test", email: "flujo@recup.com", password: hash, rol: "admin", sucursal: sucursal._id, empresa: empresa._id, activo: true, emailVerificado: true, tokenRecuperacion: tokenHasheado, tokenExpiracion: new Date(Date.now() + 3600000) });
    const res = await request(app).post("/api/usuarios/restablecer-password").send({ token: tokenPlano, password: "NuevaClave123!" });
    expect(res.statusCode).toBe(200);
  });

  test("token no reutilizable", async () => {
    // Verificar directamente en DB que el token se borra despues de usarse
    const empresa = await Empresa.create({ nombre: "RecupEmpresa2" });
    const sucursal = await Sucursal.create({ zona: 1, numero: 1, empresa: empresa._id });
    const hash = await bcrypt.hash("Clave123!", 10);
    const tokenPlano = "tokenrecuperaciondosveces456";
    const tokenHasheado = crypto.createHash("sha256").update(tokenPlano).digest("hex");
    await Usuario.create({ nombre: "Test", email: "dosveces@recup.com", password: hash, rol: "admin", sucursal: sucursal._id, empresa: empresa._id, activo: true, emailVerificado: true, tokenRecuperacion: tokenHasheado, tokenExpiracion: new Date(Date.now() + 3600000) });
    const res = await request(app).post("/api/usuarios/restablecer-password").send({ token: tokenPlano, password: "NuevaClave123!" });
    expect(res.statusCode).toBe(200);
    // Verificar que el token fue borrado de la DB
    const usuario = await require("../models/Usuario").findOne({ email: "dosveces@recup.com" });
    expect(usuario.tokenRecuperacion).toBeNull();
  });
});

describe("Movimientos - acceso", () => {
  test("movimientos requiere autenticacion", async () => {
    const res = await request(app).get("/api/movimientos");
    expect(res.statusCode).toBe(401);
  });
});

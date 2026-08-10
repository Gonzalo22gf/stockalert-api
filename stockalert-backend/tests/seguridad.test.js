const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const bcrypt = require("bcryptjs");
const app = require("../app");
const Usuario = require("../models/Usuario");
const Empresa = require("../models/Empresa");
const Sucursal = require("../models/Sucursal");

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe("Bloqueo por intentos fallidos", () => {
  test("bloquea cuenta tras 5 intentos fallidos", async () => {
    const empresa = await Empresa.create({ nombre: "BloqueoEmpresa" });
    const sucursal = await Sucursal.create({ zona: 1, numero: 1, empresa: empresa._id });
    const hash = await bcrypt.hash("Clave123!", 10);
    await Usuario.create({ nombre: "Test", email: "bloqueo@seg.com", password: hash, rol: "admin", sucursal: sucursal._id, empresa: empresa._id, activo: true, emailVerificado: true });
    for (let i = 0; i < 5; i++) {
      await request(app).post("/api/usuarios/login").send({ email: "bloqueo@seg.com", password: "ClaveWrong1!" });
    }
    const res = await request(app).post("/api/usuarios/login").send({ email: "bloqueo@seg.com", password: "Clave123!" });
    expect(res.statusCode).toBe(403);
    expect(res.body.mensaje).toMatch(/bloqueada/i);
  });
});

describe("Recuperacion de contrasena", () => {
  test("solicitar recuperacion con email inexistente devuelve 200", async () => {
    const res = await request(app).post("/api/usuarios/olvide-password").send({ email: "noexiste@seg.com" });
    expect(res.statusCode).toBe(200);
  });

  test("restablecer contrasena con token invalido devuelve 400", async () => {
    const res = await request(app).post("/api/usuarios/restablecer-password").send({ token: "tokeninvalido", password: "Nueva123!" });
    expect(res.statusCode).toBe(400);
  });

  test("restablecer contrasena con nueva clave debil devuelve 400", async () => {
    const res = await request(app).post("/api/usuarios/restablecer-password").send({ token: "cualquier", password: "debil" });
    expect(res.statusCode).toBe(400);
  });
});

describe("Endpoints de cron protegidos", () => {
  test("cron de alertas rechaza clave incorrecta", async () => {
    const res = await request(app).post("/api/alertas/enviar-diarias").set("x-cron-secret", "incorrecta");
    expect(res.statusCode).toBe(401);
  });

  test("webhook de lemon rechaza firma invalida", async () => {
    const res = await request(app).post("/api/lemon/webhook").set("x-signature", "firmainvalida").send({ meta: { event_name: "order_created" } });
    expect([400, 500]).toContain(res.statusCode);
  });
});

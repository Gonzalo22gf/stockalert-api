const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const bcrypt = require("bcryptjs");
const app = require("../app");
const Usuario = require("../models/Usuario");
const Empresa = require("../models/Empresa");
const Sucursal = require("../models/Sucursal");

let mongod, token, sucursalId, empresaId;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  const empresa = await Empresa.create({ nombre: "ValidacionEmpresa" });
  empresaId = empresa._id;
  const sucursal = await Sucursal.create({ zona: 1, numero: 1, empresa: empresa._id });
  sucursalId = sucursal._id;
  const hash = await bcrypt.hash("Clave123!", 10);
  await Usuario.create({ nombre: "Admin", email: "admin@val.com", password: hash, rol: "admin", sucursal: sucursal._id, empresa: empresa._id, activo: true, emailVerificado: true });
  const res = await request(app).post("/api/usuarios/login").send({ email: "admin@val.com", password: "Clave123!" });
  token = res.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe("Validacion de productos", () => {
  test("rechaza producto sin nombre", async () => {
    const res = await request(app)
      .post("/api/productos")
      .set("Authorization", "Bearer " + token)
      .send({ categoria: "Bebidas", precio: 100, stock: 10 });
    expect(res.statusCode).toBe(400);
  });

  test("rechaza producto con precio negativo", async () => {
    const res = await request(app)
      .post("/api/productos")
      .set("Authorization", "Bearer " + token)
      .send({ nombre: "Test", categoria: "Bebidas", precio: -5, stock: 10 });
    expect(res.statusCode).toBe(400);
  });

  test("rechaza producto sin categoria", async () => {
    const res = await request(app)
      .post("/api/productos")
      .set("Authorization", "Bearer " + token)
      .send({ nombre: "Test", precio: 100, stock: 10 });
    expect(res.statusCode).toBe(400);
  });
});

describe("Validacion de sucursales", () => {
  test("rechaza sucursal sin zona", async () => {
    const res = await request(app)
      .post("/api/sucursales")
      .set("Authorization", "Bearer " + token)
      .send({ numero: 1 });
    expect(res.statusCode).toBe(400);
  });

  test("rechaza sucursal con zona 0", async () => {
    const res = await request(app)
      .post("/api/sucursales")
      .set("Authorization", "Bearer " + token)
      .send({ zona: 0, numero: 1 });
    expect(res.statusCode).toBe(400);
  });

  test("rechaza sucursal con numero negativo", async () => {
    const res = await request(app)
      .post("/api/sucursales")
      .set("Authorization", "Bearer " + token)
      .send({ zona: 1, numero: -1 });
    expect(res.statusCode).toBe(400);
  });
});

describe("Validacion de links", () => {
  test("rechaza link sin nombre", async () => {
    const res = await request(app)
      .post("/api/links")
      .set("Authorization", "Bearer " + token)
      .send({ url: "https://ejemplo.com" });
    expect(res.statusCode).toBe(400);
  });

  test("rechaza link con URL invalida", async () => {
    const res = await request(app)
      .post("/api/links")
      .set("Authorization", "Bearer " + token)
      .send({ nombre: "Test", url: "no-es-una-url" });
    expect(res.statusCode).toBe(400);
  });

  test("acepta link valido", async () => {
    const res = await request(app)
      .post("/api/links")
      .set("Authorization", "Bearer " + token)
      .send({ nombre: "Google", url: "https://google.com" });
    expect([200, 201]).toContain(res.statusCode);
  });
});

describe("Validacion de checkout Lemon", () => {
  test("rechaza plan invalido", async () => {
    const res = await request(app)
      .post("/api/lemon/checkout")
      .set("Authorization", "Bearer " + token)
      .send({ plan: "ultraplan" });
    expect(res.statusCode).toBe(400);
  });

  test("acepta plan valido y devuelve proximamente cuando esta deshabilitado", async () => {
    const res = await request(app)
      .post("/api/lemon/checkout")
      .set("Authorization", "Bearer " + token)
      .send({ plan: "starter" });
    expect([200, 201]).toContain(res.statusCode);
    expect(res.body.proximamente).toBe(true);
  });
});

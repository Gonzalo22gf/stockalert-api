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

afterEach(async () => {
  await Usuario.deleteMany({});
  await Empresa.deleteMany({});
  await Sucursal.deleteMany({});
});

async function crearUsuarioVerificado(email = "test@test.com", password = "Clave123!") {
  const empresa = await Empresa.create({ nombre: "TestEmpresa" });
  const sucursal = await Sucursal.create({ zona: 1, numero: 1, empresa: empresa._id });
  const hash = await bcrypt.hash(password, 10);
  await Usuario.create({ nombre: "Test", email, password: hash, rol: "admin", sucursal: sucursal._id, empresa: empresa._id, activo: true, emailVerificado: true });
  return { empresa, sucursal };
}

describe("Registro de usuario", () => {
  test("rechaza registro sin datos", async () => {
    const res = await request(app).post("/api/usuarios/registro").send({});
    expect(res.statusCode).toBe(400);
  });

  test("rechaza contrasena sin mayuscula", async () => {
    const res = await request(app).post("/api/usuarios/registro").send({
      nombre: "Test", email: "test@test.com", password: "clave123!", modo: "crear", nombreEmpresa: "MiEmpresa"
    });
    expect(res.statusCode).toBe(400);
  });

  test("rechaza contrasena sin numero", async () => {
    const res = await request(app).post("/api/usuarios/registro").send({
      nombre: "Test", email: "test@test.com", password: "ClaveSegura!", modo: "crear", nombreEmpresa: "MiEmpresa"
    });
    expect(res.statusCode).toBe(400);
  });

  test("rechaza contrasena sin caracter especial", async () => {
    const res = await request(app).post("/api/usuarios/registro").send({
      nombre: "Test", email: "test@test.com", password: "ClaveSegura1", modo: "crear", nombreEmpresa: "MiEmpresa"
    });
    expect(res.statusCode).toBe(400);
  });

  test("rechaza email invalido", async () => {
    const res = await request(app).post("/api/usuarios/registro").send({
      nombre: "Test", email: "noesEmail", password: "Clave123!", modo: "crear", nombreEmpresa: "MiEmpresa"
    });
    expect(res.statusCode).toBe(400);
  });

  test("rechaza nombre demasiado corto", async () => {
    const res = await request(app).post("/api/usuarios/registro").send({
      nombre: "A", email: "test@test.com", password: "Clave123!", modo: "crear", nombreEmpresa: "MiEmpresa"
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("Login y verificacion de email", () => {
  test("no puede loguear sin verificar email", async () => {
    const empresa = await Empresa.create({ nombre: "TestEmpresa" });
    const sucursal = await Sucursal.create({ zona: 1, numero: 1, empresa: empresa._id });
    const hash = await bcrypt.hash("Clave123!", 10);
    await Usuario.create({ nombre: "Test", email: "noverif@test.com", password: hash, rol: "admin", sucursal: sucursal._id, empresa: empresa._id, activo: true, emailVerificado: false });
    const res = await request(app).post("/api/usuarios/login").send({ email: "noverif@test.com", password: "Clave123!" });
    expect(res.statusCode).toBe(403);
    expect(res.body.mensaje).toMatch(/verificar/i);
  });

  test("puede loguear con email verificado", async () => {
    await crearUsuarioVerificado("verif@test.com", "Clave123!");
    const res = await request(app).post("/api/usuarios/login").send({ email: "verif@test.com", password: "Clave123!" });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test("rechaza credenciales incorrectas", async () => {
    await crearUsuarioVerificado("verif2@test.com", "Clave123!");
    const res = await request(app).post("/api/usuarios/login").send({ email: "verif2@test.com", password: "ClaveWrong1!" });
    expect(res.statusCode).toBe(401);
  });

  test("rechaza login con email inexistente", async () => {
    const res = await request(app).post("/api/usuarios/login").send({ email: "noexiste@test.com", password: "Clave123!" });
    expect(res.statusCode).toBe(401);
  });

  test("verifica email con token valido", async () => {
    const empresa = await Empresa.create({ nombre: "TestEmpresa2" });
    const sucursal = await Sucursal.create({ zona: 1, numero: 1, empresa: empresa._id });
    const hash = await bcrypt.hash("Clave123!", 10);
    const token = "tokenvalido123";
    await Usuario.create({ nombre: "Test", email: "tokens@test.com", password: hash, rol: "admin", sucursal: sucursal._id, empresa: empresa._id, activo: true, emailVerificado: false, tokenVerificacion: token, tokenVerificacionExpira: new Date(Date.now() + 3600000) });
    const res = await request(app).get("/api/usuarios/verificar-email?token=" + token);
    expect(res.statusCode).toBe(200);
    expect(res.body.mensaje).toMatch(/verificado/i);
  });

  test("rechaza token de verificacion invalido", async () => {
    const res = await request(app).get("/api/usuarios/verificar-email?token=tokeninvalido");
    expect(res.statusCode).toBe(400);
  });

  test("rechaza token de verificacion expirado", async () => {
    const empresa = await Empresa.create({ nombre: "TestEmpresa3" });
    const sucursal = await Sucursal.create({ zona: 1, numero: 1, empresa: empresa._id });
    const hash = await bcrypt.hash("Clave123!", 10);
    const token = "tokenexpirado456";
    await Usuario.create({ nombre: "Test", email: "exp@test.com", password: hash, rol: "admin", sucursal: sucursal._id, empresa: empresa._id, activo: true, emailVerificado: false, tokenVerificacion: token, tokenVerificacionExpira: new Date(Date.now() - 1000) });
    const res = await request(app).get("/api/usuarios/verificar-email?token=" + token);
    expect(res.statusCode).toBe(400);
    expect(res.body.mensaje).toMatch(/expiro/i);
  });
});

describe("Seguridad adicional", () => {
  test("cuenta desactivada no puede loguear", async () => {
    const empresa = await Empresa.create({ nombre: "TestEmpresa4" });
    const sucursal = await Sucursal.create({ zona: 1, numero: 1, empresa: empresa._id });
    const hash = await bcrypt.hash("Clave123!", 10);
    await Usuario.create({ nombre: "Test", email: "inactivo@test.com", password: hash, rol: "admin", sucursal: sucursal._id, empresa: empresa._id, activo: false, emailVerificado: true });
    const res = await request(app).post("/api/usuarios/login").send({ email: "inactivo@test.com", password: "Clave123!" });
    expect(res.statusCode).toBe(403);
  });

  test("jefe no puede acceder a rutas de admin", async () => {
    const empresa = await Empresa.create({ nombre: "TestEmpresa5" });
    const sucursal = await Sucursal.create({ zona: 1, numero: 1, empresa: empresa._id });
    const hash = await bcrypt.hash("Clave123!", 10);
    await Usuario.create({ nombre: "Jefe", email: "jefe@test.com", password: hash, rol: "jefe", sucursal: sucursal._id, empresa: empresa._id, activo: true, emailVerificado: true });
    const login = await request(app).post("/api/usuarios/login").send({ email: "jefe@test.com", password: "Clave123!" });
    const token = login.body.token;
    const res = await request(app).get("/api/usuarios").set("Authorization", "Bearer " + token);
    expect(res.statusCode).toBe(403);
  });

  test("superadmin rechaza usuario normal", async () => {
    await crearUsuarioVerificado("normal@test.com", "Clave123!");
    const login = await request(app).post("/api/usuarios/login").send({ email: "normal@test.com", password: "Clave123!" });
    const token = login.body.token;
    const res = await request(app).get("/api/superadmin/metricas").set("Authorization", "Bearer " + token);
    expect(res.statusCode).toBe(403);
  });

  test("webhook de lemon rechaza firma invalida", async () => {
    const res = await request(app)
      .post("/api/lemon/webhook")
      .set("x-signature", "firmainvalida")
      .send({ meta: { event_name: "order_created" } });
    expect([400, 500]).toContain(res.statusCode);
  });

  test("cron de alertas rechaza clave incorrecta", async () => {
    const res = await request(app)
      .post("/api/alertas/enviar-diarias")
      .set("x-cron-secret", "incorrecta");
    expect(res.statusCode).toBe(401);
  });
});

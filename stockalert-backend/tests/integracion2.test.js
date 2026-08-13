const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const bcrypt = require("bcryptjs");
const app = require("../app");
const Usuario = require("../models/Usuario");
const Empresa = require("../models/Empresa");
const Sucursal = require("../models/Sucursal");
const Producto = require("../models/Producto");
const Movimiento = require("../models/Movimiento");

let mongod;

beforeEach(async () => {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterEach(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

async function crearAdmin() {
  const empresa = await Empresa.create({ nombre: "TestEmpresa" });
  const sucursal = await Sucursal.create({ zona: 1, numero: 1, empresa: empresa._id });
  const hash = await bcrypt.hash("Clave123!", 10);
  await Usuario.create({ nombre: "Admin", email: "admin@test.com", password: hash, rol: "admin", sucursal: sucursal._id, empresa: empresa._id, activo: true, emailVerificado: true });
  const login = await request(app).post("/api/usuarios/login").send({ email: "admin@test.com", password: "Clave123!" });
  return { token: login.body.token, empresa, sucursal };
}

async function crearProducto(token, sucursalId) {
  return request(app).post("/api/productos").set("Authorization", "Bearer " + token).send({
    nombre: "Leche", categoria: "Bebidas", precio: 100, sucursal: sucursalId.toString(),
    lotes: [{ numero: "L001", stock: 10, vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] }]
  });
}

describe("Bulk delete", () => {
  test("bulk delete requiere autenticacion", async () => {
    const res = await request(app).delete("/api/productos/bulk-delete").send({ ids: ["id1"] });
    expect(res.statusCode).toBe(401);
  });

  test("bulk delete de lista vacia devuelve 400", async () => {
    const { token } = await crearAdmin();
    const res = await request(app).delete("/api/productos/bulk-delete").set("Authorization", "Bearer " + token).send({ ids: [] });
    expect(res.statusCode).toBe(400);
  });

  test("bulk delete de lista vacia devuelve el mensaje real de Zod, no el fallback", async () => {
    const { token } = await crearAdmin();
    const res = await request(app).delete("/api/productos/bulk-delete").set("Authorization", "Bearer " + token).send({ ids: [] });
    expect(res.statusCode).toBe(400);
    expect(res.body.mensaje).not.toBe("Datos invalidos");
    expect(res.body.mensaje.toLowerCase()).toContain("producto");
  });


  test("bulk delete de productos propios funciona", async () => {
    const { token, sucursal } = await crearAdmin();
    const p1 = await crearProducto(token, sucursal._id);
    const p2 = await crearProducto(token, sucursal._id);
    const res = await request(app).delete("/api/productos/bulk-delete").set("Authorization", "Bearer " + token).send({ ids: [p1.body._id, p2.body._id] });
    expect(res.statusCode).toBe(200);
    expect(res.body.eliminados).toBe(2);
  });

  test("bulk delete IDOR no elimina productos de otra empresa", async () => {
    const { token } = await crearAdmin();
    const empresa2 = await Empresa.create({ nombre: "Empresa2" });
    const sucursal2 = await Sucursal.create({ zona: 1, numero: 1, empresa: empresa2._id });
    const prod = await Producto.create({ nombre: "Ajeno", categoria: "Bebidas", precio: 100, stock: 5, vencimiento: new Date(Date.now() + 30 * 86400000), empresa: empresa2._id, sucursal: sucursal2._id, usuario: new mongoose.Types.ObjectId() });
    const res = await request(app).delete("/api/productos/bulk-delete").set("Authorization", "Bearer " + token).send({ ids: [prod._id.toString()] });
    expect(res.statusCode).toBe(404);
  });

  test("bulk delete genera movimientos de baja", async () => {
    const { token, sucursal } = await crearAdmin();
    const p1 = await crearProducto(token, sucursal._id);
    const p2 = await crearProducto(token, sucursal._id);
    await request(app).delete("/api/productos/bulk-delete").set("Authorization", "Bearer " + token).send({ ids: [p1.body._id, p2.body._id] });
    const movimientos = await Movimiento.find({ accion: "ELIMINAR" });
    expect(movimientos.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Estructura de respuestas sin password", () => {
  test("login no devuelve password", async () => {
    await crearAdmin();
    const res = await request(app).post("/api/usuarios/login").send({ email: "admin@test.com", password: "Clave123!" });
    expect(res.body.password).toBeUndefined();
  });

  test("login devuelve token nombre email y rol", async () => {
    await crearAdmin();
    const res = await request(app).post("/api/usuarios/login").send({ email: "admin@test.com", password: "Clave123!" });
    expect(res.body.token).toBeDefined();
    expect(res.body.nombre).toBeDefined();
    expect(res.body.email).toBeDefined();
    expect(res.body.rol).toBeDefined();
  });

  test("GET usuarios no devuelve password en ningun objeto", async () => {
    const { token } = await crearAdmin();
    const res = await request(app).get("/api/usuarios").set("Authorization", "Bearer " + token);
    expect(res.statusCode).toBe(200);
    res.body.forEach((u) => expect(u.password).toBeUndefined());
  });
});

describe("Validaciones Zod edge cases", () => {
  test("nombre con solo espacios devuelve 400", async () => {
    const res = await request(app).post("/api/usuarios/registro").send({
      nombre: "   ", email: "test@test.com", password: "Clave123!", modo: "crear", nombreEmpresa: "MiEmpresa"
    });
    expect(res.statusCode).toBe(400);
  });

  test("precio negativo en producto devuelve 400", async () => {
    const { token, sucursal } = await crearAdmin();
    const res = await request(app).post("/api/productos").set("Authorization", "Bearer " + token).send({
      nombre: "Test", categoria: "Bebidas", precio: -50, sucursal: sucursal._id.toString(),
      lotes: [{ numero: "L001", stock: 10, vencimiento: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0] }]
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("Seguridad headers", () => {
  test("respuesta no expone X-Powered-By", async () => {
    const res = await request(app).get("/");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  test("respuesta incluye X-Content-Type-Options", async () => {
    const res = await request(app).get("/");
    expect(res.headers["x-content-type-options"]).toBeDefined();
  });
});

describe("Empresa codigo de acceso", () => {
  test("empresa creada por registro tiene codigo de acceso", async () => {
    const reg = await request(app).post("/api/usuarios/registro").send({
      nombre: "Fundador", email: "fundador@test.com", password: "Clave123!",
      modo: "crear", nombreEmpresa: "NuevaEmpresa"
    });
    expect([200, 201]).toContain(reg.statusCode);

    // El codigo lo genera el flujo de registro, no el schema
    const empresa = await Empresa.findOne({ nombre: "NuevaEmpresa" });
    expect(empresa.codigoAcceso).toBeDefined();
    expect(empresa.codigoAcceso.length).toBeGreaterThan(3);

    // Y el endpoint de perfil lo devuelve
    await Usuario.updateOne({ email: "fundador@test.com" }, { emailVerificado: true });
    const login = await request(app).post("/api/usuarios/login").send({ email: "fundador@test.com", password: "Clave123!" });
    const res = await request(app).get("/api/empresa/perfil").set("Authorization", "Bearer " + login.body.token);
    expect(res.statusCode).toBe(200);
    expect(res.body.codigoAcceso).toBe(empresa.codigoAcceso);
  });
});

describe("Push idempotencia", () => {
  test("desuscribir token inexistente devuelve ok", async () => {
    const { token } = await crearAdmin();
    const res = await request(app).post("/api/push/desuscribir").set("Authorization", "Bearer " + token).send({ token: "tokenmuylargoquenoestaregistrado12345678" });
    expect(res.statusCode).toBe(200);
  });
});

describe("Usuarios validaciones", () => {
  test("jefe no puede crear otros usuarios", async () => {
    const empresa = await Empresa.create({ nombre: "JefeEmpresa" });
    const sucursal = await Sucursal.create({ zona: 1, numero: 1, empresa: empresa._id });
    const hash = await bcrypt.hash("Clave123!", 10);
    await Usuario.create({ nombre: "Jefe", email: "jefe@test.com", password: hash, rol: "jefe", sucursal: sucursal._id, empresa: empresa._id, activo: true, emailVerificado: true });
    const login = await request(app).post("/api/usuarios/login").send({ email: "jefe@test.com", password: "Clave123!" });
    const res = await request(app).post("/api/usuarios").set("Authorization", "Bearer " + login.body.token).send({
      nombre: "Nuevo", email: "nuevo@test.com", password: "Clave123!"
    });
    expect([400, 403, 404]).toContain(res.statusCode);
  });
});

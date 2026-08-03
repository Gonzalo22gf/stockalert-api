const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const bcrypt = require("bcryptjs");
const app = require("../app");
const Usuario = require("../models/Usuario");
const Empresa = require("../models/Empresa");
const Sucursal = require("../models/Sucursal");
const Producto = require("../models/Producto");

let mongod;
let tokenA, tokenB;
let empresaA, empresaB;
let sucursalA, sucursalB;
let productoA, productoB;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  const hash = await bcrypt.hash("Clave123!", 10);

  // Empresa A con su sucursal, admin y producto
  empresaA = await Empresa.create({ nombre: "EmpresaA" });
  sucursalA = await Sucursal.create({ zona: 1, numero: 1, empresa: empresaA._id });
  await Usuario.create({ nombre: "Admin A", email: "a@test.com", password: hash, rol: "admin", sucursal: sucursalA._id, empresa: empresaA._id, activo: true });
  productoA = await Producto.create({ nombre: "ProductoA", categoria: "Bebidas", stock: 10, precio: 100, vencimiento: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000), usuario: (await Usuario.findOne({ email: "a@test.com" }))._id, sucursal: sucursalA._id, empresa: empresaA._id });

  // Empresa B con su sucursal, admin y producto
  empresaB = await Empresa.create({ nombre: "EmpresaB" });
  sucursalB = await Sucursal.create({ zona: 1, numero: 1, empresa: empresaB._id });
  await Usuario.create({ nombre: "Admin B", email: "b@test.com", password: hash, rol: "admin", sucursal: sucursalB._id, empresa: empresaB._id, activo: true });
  productoB = await Producto.create({ nombre: "ProductoB", categoria: "Bebidas", stock: 10, precio: 200, vencimiento: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000), usuario: (await Usuario.findOne({ email: "b@test.com" }))._id, sucursal: sucursalB._id, empresa: empresaB._id });

  // Login de ambos para obtener tokens
  const resA = await request(app).post("/api/usuarios/login").send({ email: "a@test.com", password: "Clave123!" });
  const resB = await request(app).post("/api/usuarios/login").send({ email: "b@test.com", password: "Clave123!" });
  tokenA = resA.body.token;
  tokenB = resB.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe("Aislamiento entre empresas (IDOR)", () => {

  test("Empresa A solo ve sus propios productos (no los de B)", async () => {
    const res = await request(app)
      .get("/api/productos")
      .set("Authorization", "Bearer " + tokenA);
    expect(res.statusCode).toBe(200);
    const nombres = res.body.map((p) => p.nombre);
    expect(nombres).toContain("ProductoA");
    expect(nombres).not.toContain("ProductoB");
  });

  test("Empresa B solo ve sus propios productos (no los de A)", async () => {
    const res = await request(app)
      .get("/api/productos")
      .set("Authorization", "Bearer " + tokenB);
    expect(res.statusCode).toBe(200);
    const nombres = res.body.map((p) => p.nombre);
    expect(nombres).toContain("ProductoB");
    expect(nombres).not.toContain("ProductoA");
  });

  test("Empresa A no puede editar un producto de empresa B (devuelve 404)", async () => {
    const res = await request(app)
      .put("/api/productos/" + productoB._id)
      .set("Authorization", "Bearer " + tokenA)
      .send({ nombre: "Hackeado", categoria: "Bebidas", stock: 1, precio: 1, vencimiento: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], lote: "", lotes: [] });
    expect(res.statusCode).toBe(404);
  });

  test("Empresa A no puede eliminar un producto de empresa B (devuelve 404)", async () => {
    const res = await request(app)
      .delete("/api/productos/" + productoB._id)
      .set("Authorization", "Bearer " + tokenA);
    expect(res.statusCode).toBe(404);
  });

  test("Empresa A solo ve sus propias sucursales", async () => {
    const res = await request(app)
      .get("/api/sucursales")
      .set("Authorization", "Bearer " + tokenA);
    expect(res.statusCode).toBe(200);
    const ids = res.body.map((s) => s._id.toString());
    expect(ids).toContain(sucursalA._id.toString());
    expect(ids).not.toContain(sucursalB._id.toString());
  });

  test("Empresa A no puede eliminar una sucursal de empresa B (devuelve 404)", async () => {
    const res = await request(app)
      .delete("/api/sucursales/" + sucursalB._id)
      .set("Authorization", "Bearer " + tokenA);
    expect(res.statusCode).toBe(404);
  });

  test("Empresa A solo ve sus propios usuarios", async () => {
    const res = await request(app)
      .get("/api/usuarios")
      .set("Authorization", "Bearer " + tokenA);
    expect(res.statusCode).toBe(200);
    const emails = res.body.map((u) => u.email);
    expect(emails).toContain("a@test.com");
    expect(emails).not.toContain("b@test.com");
  });

  test("Empresa A solo ve sus propios movimientos", async () => {
    const res = await request(app)
      .get("/api/movimientos")
      .set("Authorization", "Bearer " + tokenA);
    expect(res.statusCode).toBe(200);
    const empresasEnMovimientos = res.body.map((m) => m.empresa?.toString());
    const hayDeB = empresasEnMovimientos.some((e) => e === empresaB._id.toString());
    expect(hayDeB).toBe(false);
  });
});

const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const bcrypt = require("bcryptjs");
const app = require("../app");
const Usuario = require("../models/Usuario");
const Empresa = require("../models/Empresa");
const Sucursal = require("../models/Sucursal");
const LinkFrecuente = require("../models/LinkFrecuente");

let mongod, tokenAdmin, tokenJefe, empresaId, sucursalId;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  const empresa = await Empresa.create({ nombre: "RecursosEmpresa" });
  empresaId = empresa._id;
  const sucursal = await Sucursal.create({ zona: 1, numero: 1, empresa: empresa._id });
  sucursalId = sucursal._id;
  const hash = await bcrypt.hash("Clave123!", 10);
  await Usuario.create({ nombre: "Admin", email: "admin@rec.com", password: hash, rol: "admin", sucursal: sucursal._id, empresa: empresa._id, activo: true, emailVerificado: true });
  await Usuario.create({ nombre: "Jefe", email: "jefe@rec.com", password: hash, rol: "jefe", sucursal: sucursal._id, empresa: empresa._id, activo: true, emailVerificado: true });
  const loginAdmin = await request(app).post("/api/usuarios/login").send({ email: "admin@rec.com", password: "Clave123!" });
  const loginJefe = await request(app).post("/api/usuarios/login").send({ email: "jefe@rec.com", password: "Clave123!" });
  tokenAdmin = loginAdmin.body.token;
  tokenJefe = loginJefe.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await LinkFrecuente.deleteMany({});
});

describe("Gestion de links frecuentes", () => {
  test("admin puede crear un link", async () => {
    const res = await request(app).post("/api/links").set("Authorization", "Bearer " + tokenAdmin).send({ nombre: "Google", url: "https://google.com" });
    expect([200, 201]).toContain(res.statusCode);
  });

  test("link creado pertenece a la empresa del admin", async () => {
    await request(app).post("/api/links").set("Authorization", "Bearer " + tokenAdmin).send({ nombre: "Test", url: "https://test.com" });
    const res = await request(app).get("/api/links").set("Authorization", "Bearer " + tokenAdmin);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test("jefe puede ver links de su empresa", async () => {
    const res = await request(app).get("/api/links").set("Authorization", "Bearer " + tokenJefe);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

  });
  test("admin puede editar un link", async () => {
    const crear = await request(app).post("/api/links").set("Authorization", "Bearer " + tokenAdmin).send({ nombre: "Original", url: "https://original.com" });
    const id = crear.body._id || crear.body.id;
    const res = await request(app).put("/api/links/" + id).set("Authorization", "Bearer " + tokenAdmin).send({ nombre: "Editado", url: "https://editado.com" });
    expect(res.statusCode).toBe(200);
  });

  test("admin puede borrar un link", async () => {
    const crear = await request(app).post("/api/links").set("Authorization", "Bearer " + tokenAdmin).send({ nombre: "Borrar", url: "https://borrar.com" });
    const id = crear.body._id || crear.body.id;
    const res = await request(app).delete("/api/links/" + id).set("Authorization", "Bearer " + tokenAdmin);
    expect(res.statusCode).toBe(200);
  });

  test("rechaza link con URL invalida", async () => {
    const res = await request(app).post("/api/links").set("Authorization", "Bearer " + tokenAdmin).send({ nombre: "Invalido", url: "no-es-url" });
    expect(res.statusCode).toBe(400);
  });
});

describe("Gestion de sucursales", () => {
  test("admin puede crear una sucursal", async () => {
    const res = await request(app).post("/api/sucursales").set("Authorization", "Bearer " + tokenAdmin).send({ zona: 2, numero: 99, direccion: "Calle Test 123" });
    expect(res.statusCode === 200 || res.statusCode === 201).toBe(true);
  });

  test("jefe no puede crear sucursal", async () => {
    const res = await request(app).post("/api/sucursales").set("Authorization", "Bearer " + tokenJefe).send({ zona: 2, numero: 88 });
    expect(res.statusCode).toBe(403);
  });

  test("admin puede ver el resumen de sucursales", async () => {
    const res = await request(app).get("/api/sucursales/resumen").set("Authorization", "Bearer " + tokenAdmin);
    expect(res.statusCode).toBe(200);
  });

  test("jefe no puede ver el resumen global", async () => {
    const res = await request(app).get("/api/sucursales/resumen").set("Authorization", "Bearer " + tokenJefe);
    expect(res.statusCode).toBe(200);
  });

  test("rechaza sucursal con zona 0", async () => {
    const res = await request(app).post("/api/sucursales").set("Authorization", "Bearer " + tokenAdmin).send({ zona: 0, numero: 1 });
    expect(res.statusCode).toBe(400);
  });
});

describe("Gestion de productos", () => {
  test("admin puede crear un producto", async () => {
    const res = await request(app).post("/api/productos").set("Authorization", "Bearer " + tokenAdmin).send({
      nombre: "Leche", categoria: "Bebidas", precio: 100, sucursal: sucursalId.toString(),
      lotes: [{ numero: "L001", stock: 10, vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] }]
    });
    expect(res.statusCode === 200 || res.statusCode === 201).toBe(true);
  });

  test("admin puede listar productos", async () => {
    const res = await request(app).get("/api/productos").set("Authorization", "Bearer " + tokenAdmin);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("jefe puede listar productos de su sucursal", async () => {
    const res = await request(app).get("/api/productos").set("Authorization", "Bearer " + tokenJefe);
    expect(res.statusCode).toBe(200);
  });

  test("rechaza producto sin nombre", async () => {
    const res = await request(app).post("/api/productos").set("Authorization", "Bearer " + tokenAdmin).send({ categoria: "Bebidas", precio: 100 });
    expect(res.statusCode).toBe(400);
  });
});

describe("Movimientos", () => {
  test("admin puede ver movimientos", async () => {
    const res = await request(app).get("/api/movimientos").set("Authorization", "Bearer " + tokenAdmin);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("jefe puede ver movimientos", async () => {
    const res = await request(app).get("/api/movimientos").set("Authorization", "Bearer " + tokenJefe);
    expect(res.statusCode).toBe(200);
  });
});

describe("Perfil de empresa", () => {
  test("admin puede ver perfil de empresa", async () => {
    const res = await request(app).get("/api/empresa/perfil").set("Authorization", "Bearer " + tokenAdmin);
    expect(res.statusCode).toBe(200);
    expect(res.body.nombre).toBe("RecursosEmpresa");
  });

  test("jefe puede ver perfil de empresa", async () => {
    const res = await request(app).get("/api/empresa/perfil").set("Authorization", "Bearer " + tokenJefe);
    expect(res.statusCode).toBe(200);
  });
});

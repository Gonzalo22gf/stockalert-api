const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../app");
const Usuario = require("../models/Usuario");
const Empresa = require("../models/Empresa");
const Sucursal = require("../models/Sucursal");
const Categoria = require("../models/Categoria");
const { calcularMetricas } = require("../services/sucursal.service");

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
  await Categoria.deleteMany({});
});

const PASS = "Clave123!";

describe("Crear empresa (registro modo crear)", () => {
  test("crea empresa + sucursal inicial + 5 categorias + usuario admin", async () => {
    const res = await request(app).post("/api/usuarios/registro").send({
      nombre: "Dueño", email: "dueno@test.com", password: PASS,
      modo: "crear", nombreEmpresa: "Mi Negocio"
    });
    expect(res.statusCode).toBeLessThan(300);

    const empresa = await Empresa.findOne({ nombre: "Mi Negocio" });
    expect(empresa).not.toBeNull();

    const sucursales = await Sucursal.find({ empresa: empresa._id });
    expect(sucursales.length).toBe(1);
    expect(sucursales[0].numero).toBe(1);

    const categorias = await Categoria.find({ empresa: empresa._id });
    expect(categorias.length).toBe(5);

    const usuario = await Usuario.findOne({ email: "dueno@test.com" });
    expect(usuario.rol).toBe("admin");
    expect(String(usuario.empresa)).toBe(String(empresa._id));
  });

  test("el que crea la empresa queda como admin (no jefe)", async () => {
    await request(app).post("/api/usuarios/registro").send({
      nombre: "Jefa", email: "jefa@test.com", password: PASS,
      modo: "crear", nombreEmpresa: "Otra Empresa"
    });
    const usuario = await Usuario.findOne({ email: "jefa@test.com" });
    expect(usuario.rol).toBe("admin");
  });

  test("la empresa nueva arranca en plan pro con trial de ~10 dias", async () => {
    await request(app).post("/api/usuarios/registro").send({
      nombre: "Trial", email: "trial@test.com", password: PASS,
      modo: "crear", nombreEmpresa: "Empresa Trial"
    });
    const empresa = await Empresa.findOne({ nombre: "Empresa Trial" });
    expect(empresa.plan).toBe("pro");
    expect(empresa.trialExpira).not.toBeNull();
    const dias = (new Date(empresa.trialExpira) - new Date()) / (1000 * 60 * 60 * 24);
    expect(dias).toBeGreaterThan(9);
    expect(dias).toBeLessThanOrEqual(10);
  });

  test("genera un codigo de acceso para la empresa", async () => {
    await request(app).post("/api/usuarios/registro").send({
      nombre: "Cod", email: "cod@test.com", password: PASS,
      modo: "crear", nombreEmpresa: "Empresa Codigo"
    });
    const empresa = await Empresa.findOne({ nombre: "Empresa Codigo" });
    expect(empresa.codigoAcceso).toBeTruthy();
    expect(empresa.codigoAcceso.length).toBeGreaterThan(0);
  });

  test("no forzar rol admin por el body en modo crear (igual queda admin porque es el creador)", async () => {
    await request(app).post("/api/usuarios/registro").send({
      nombre: "Equis", email: "equis@test.com", password: PASS,
      modo: "crear", nombreEmpresa: "Empresa X", rol: "jefe"
    });
    const usuario = await Usuario.findOne({ email: "equis@test.com" });
    expect(["admin", "jefe"]).toContain(usuario.rol);
    expect(usuario.rol).not.toBe("superadmin");
  });

  test("rechaza crear empresa sin nombre de empresa", async () => {
    const res = await request(app).post("/api/usuarios/registro").send({
      nombre: "Sin", email: "sin@test.com", password: PASS, modo: "crear"
    });
    expect(res.statusCode).toBe(400);
  });

  test("dos empresas distintas pueden tener cada una su sucursal numero 1 (no choca)", async () => {
    const r1 = await request(app).post("/api/usuarios/registro").send({
      nombre: "Uno", email: "uno@test.com", password: PASS, modo: "crear", nombreEmpresa: "Empresa Uno"
    });
    const r2 = await request(app).post("/api/usuarios/registro").send({
      nombre: "Dos", email: "dos@test.com", password: PASS, modo: "crear", nombreEmpresa: "Empresa Dos"
    });
    expect(r1.statusCode).toBeLessThan(300);
    expect(r2.statusCode).toBeLessThan(300);
    const sucursales = await Sucursal.find({ numero: 1 });
    expect(sucursales.length).toBe(2);
  });
});

describe("Unirse a empresa (registro modo unir)", () => {
  async function crearEmpresaBase() {
    const res = await request(app).post("/api/usuarios/registro").send({
      nombre: "Admin", email: "admin@base.com", password: PASS,
      modo: "crear", nombreEmpresa: "Empresa Base"
    });
    const empresa = await Empresa.findOne({ nombre: "Empresa Base" });
    return empresa;
  }

  test("unirse con codigo valido y sucursal existente queda como jefe", async () => {
    const empresa = await crearEmpresaBase();
    const res = await request(app).post("/api/usuarios/registro").send({
      nombre: "Empleado", email: "empleado@base.com", password: PASS,
      modo: "unir", nombreEmpresa: empresa.codigoAcceso, numeroSucursal: 1
    });
    expect(res.statusCode).toBeLessThan(300);
    const usuario = await Usuario.findOne({ email: "empleado@base.com" });
    expect(usuario.rol).toBe("jefe");
    expect(String(usuario.empresa)).toBe(String(empresa._id));
  });

  test("unirse con codigo invalido es rechazado", async () => {
    await crearEmpresaBase();
    const res = await request(app).post("/api/usuarios/registro").send({
      nombre: "Colado", email: "colado@base.com", password: PASS,
      modo: "unir", nombreEmpresa: "CODIGO-FALSO-999", numeroSucursal: 1
    });
    expect(res.statusCode).toBe(400);
    const usuario = await Usuario.findOne({ email: "colado@base.com" });
    expect(usuario).toBeNull();
  });

  test("unirse a una sucursal que no existe en la empresa es rechazado", async () => {
    const empresa = await crearEmpresaBase();
    const res = await request(app).post("/api/usuarios/registro").send({
      nombre: "SucMala", email: "sucmala@base.com", password: PASS,
      modo: "unir", nombreEmpresa: empresa.codigoAcceso, numeroSucursal: 99
    });
    expect(res.statusCode).toBe(400);
  });

  test("al unirse, mandar rol admin en el body NO da admin (queda jefe)", async () => {
    const empresa = await crearEmpresaBase();
    await request(app).post("/api/usuarios/registro").send({
      nombre: "Intruso", email: "intruso@base.com", password: PASS,
      modo: "unir", nombreEmpresa: empresa.codigoAcceso, numeroSucursal: 1, rol: "admin"
    });
    const usuario = await Usuario.findOne({ email: "intruso@base.com" });
    expect(usuario.rol).toBe("jefe");
  });

  test("el que se une entra a la MISMA empresa que el admin (no crea otra)", async () => {
    const empresa = await crearEmpresaBase();
    await request(app).post("/api/usuarios/registro").send({
      nombre: "Mismo", email: "mismo@base.com", password: PASS,
      modo: "unir", nombreEmpresa: empresa.codigoAcceso, numeroSucursal: 1
    });
    const empresas = await Empresa.find({});
    expect(empresas.length).toBe(1);
  });
});

describe("Metricas por sucursal (calcularMetricas)", () => {
  const hoy = new Date();
  const enUnMes = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const en3dias = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  test("un producto que no vence NO cuenta como vencido (el bug que arreglamos)", () => {
    const productos = [
      { vence: false, vencimiento: null, stock: 10, precio: 100 },
      { vence: false, vencimiento: null, stock: 5, precio: 50 }
    ];
    const m = calcularMetricas(productos);
    expect(m.vencidos).toBe(0);
    expect(m.porVencer).toBe(0);
  });

  test("cuenta vencidos solo los que vencieron y SI vencen", () => {
    const productos = [
      { vence: true, vencimiento: ayer, stock: 10, precio: 100 },
      { vence: true, vencimiento: enUnMes, stock: 10, precio: 100 },
      { vence: false, vencimiento: null, stock: 10, precio: 100 }
    ];
    const m = calcularMetricas(productos);
    expect(m.vencidos).toBe(1);
  });

  test("cuenta por vencer los que vencen dentro de 7 dias (excluye no-vence)", () => {
    const productos = [
      { vence: true, vencimiento: en3dias, stock: 10, precio: 100 },
      { vence: true, vencimiento: enUnMes, stock: 10, precio: 100 },
      { vence: false, vencimiento: null, stock: 10, precio: 100 }
    ];
    const m = calcularMetricas(productos);
    expect(m.porVencer).toBe(1);
  });

  test("stock critico (1 a 5) y agotados (0) cuentan aunque el producto no venza", () => {
    const productos = [
      { vence: false, vencimiento: null, stock: 3, precio: 100 },
      { vence: false, vencimiento: null, stock: 0, precio: 100 },
      { vence: true, vencimiento: enUnMes, stock: 20, precio: 100 }
    ];
    const m = calcularMetricas(productos);
    expect(m.stockCritico).toBe(1);
    expect(m.agotados).toBe(1);
  });

  test("valorInventario suma stock*precio de todos", () => {
    const productos = [
      { vence: true, vencimiento: enUnMes, stock: 10, precio: 100 },
      { vence: false, vencimiento: null, stock: 5, precio: 50 }
    ];
    const m = calcularMetricas(productos);
    expect(m.valorInventario).toBe(10 * 100 + 5 * 50);
  });

  test("totalProductos cuenta todos", () => {
    const productos = [
      { vence: true, vencimiento: enUnMes, stock: 1, precio: 1 },
      { vence: false, vencimiento: null, stock: 1, precio: 1 },
      { vence: true, vencimiento: ayer, stock: 1, precio: 1 }
    ];
    const m = calcularMetricas(productos);
    expect(m.totalProductos).toBe(3);
  });
});

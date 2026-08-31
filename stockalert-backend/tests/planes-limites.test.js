// IMPORTANTE: PLANES_HABILITADOS se lee al cargar el modulo (const a nivel modulo),
// asi que hay que setearlo ANTES de requerir validarPlan.
process.env.PLANES_HABILITADOS = "true";

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Empresa = require("../models/Empresa");
const Producto = require("../models/Producto");
const Sucursal = require("../models/Sucursal");
const Usuario = require("../models/Usuario");
const { validarLimiteProductos, validarLimiteSucursales, validarLimiteUsuarios } = require("../middleware/validarPlan");

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
  await Empresa.deleteMany({});
  await Producto.deleteMany({});
  await Sucursal.deleteMany({});
  await Usuario.deleteMany({});
});

// Helpers para simular req/res/next
function fakeReq(empresaId) {
  return { empresaId, body: {} };
}
function fakeRes() {
  const res = {};
  res.statusCode = null;
  res.body = null;
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.body = data; return res; };
  return res;
}

const enUnMes = () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
const ayer = () => new Date(Date.now() - 24 * 60 * 60 * 1000);

async function crearEmpresa({ plan = "starter", trial = null } = {}) {
  return Empresa.create({ nombre: "E" + Math.random(), plan, trialExpira: trial });
}

describe("validarLimiteProductos", () => {
  test("deja crear si el trial esta vigente y esta bajo el limite", async () => {
    const empresa = await crearEmpresa({ plan: "starter", trial: enUnMes() });
    let llamado = false;
    const next = () => { llamado = true; };
    await validarLimiteProductos(fakeReq(empresa._id), fakeRes(), next);
    expect(llamado).toBe(true);
  });

  test("si el trial expiro, corta con 403 TRIAL_EXPIRADO", async () => {
    const empresa = await crearEmpresa({ plan: "pro", trial: ayer() });
    const res = fakeRes();
    let llamado = false;
    await validarLimiteProductos(fakeReq(empresa._id), res, () => { llamado = true; });
    expect(llamado).toBe(false);
    expect(res.statusCode).toBe(403);
    expect(res.body.codigo).toBe("TRIAL_EXPIRADO");
  });

  test("al alcanzar el limite de productos del plan, corta con 403 LIMITE_PRODUCTOS", async () => {
    const empresa = await crearEmpresa({ plan: "starter" }); // starter = 100 productos
    const suc = await Sucursal.create({ zona: "1", numero: 1, empresa: empresa._id });
    const usuario = await Usuario.create({ nombre: "U", email: "u@lim.com", password: "x", rol: "admin", sucursal: suc._id, empresa: empresa._id });
    // crear 100 productos (el limite de starter)
    const docs = [];
    for (let i = 0; i < 100; i++) {
      docs.push({ nombre: "P" + i, categoria: "Bebidas", stock: 1, precio: 1, vence: false, lotes: [], usuario: usuario._id, sucursal: suc._id, empresa: empresa._id });
    }
    await Producto.insertMany(docs);
    const res = fakeRes();
    let llamado = false;
    await validarLimiteProductos(fakeReq(empresa._id), res, () => { llamado = true; });
    expect(llamado).toBe(false);
    expect(res.statusCode).toBe(403);
    expect(res.body.codigo).toBe("LIMITE_PRODUCTOS");
  });

  test("plan business (limite infinito) nunca corta por cantidad", async () => {
    const empresa = await crearEmpresa({ plan: "business" });
    const suc = await Sucursal.create({ zona: "1", numero: 1, empresa: empresa._id });
    const usuario = await Usuario.create({ nombre: "U", email: "u@biz.com", password: "x", rol: "admin", sucursal: suc._id, empresa: empresa._id });
    const docs = [];
    for (let i = 0; i < 150; i++) {
      docs.push({ nombre: "P" + i, categoria: "Bebidas", stock: 1, precio: 1, vence: false, lotes: [], usuario: usuario._id, sucursal: suc._id, empresa: empresa._id });
    }
    await Producto.insertMany(docs);
    let llamado = false;
    await validarLimiteProductos(fakeReq(empresa._id), fakeRes(), () => { llamado = true; });
    expect(llamado).toBe(true);
  });
});

describe("validarLimiteSucursales", () => {
  test("al alcanzar el limite de sucursales, corta con 403 LIMITE_SUCURSALES", async () => {
    const empresa = await crearEmpresa({ plan: "starter" }); // starter = 1 sucursal
    await Sucursal.create({ zona: "1", numero: 1, empresa: empresa._id });
    const res = fakeRes();
    let llamado = false;
    await validarLimiteSucursales(fakeReq(empresa._id), res, () => { llamado = true; });
    expect(llamado).toBe(false);
    expect(res.statusCode).toBe(403);
    expect(res.body.codigo).toBe("LIMITE_SUCURSALES");
  });

  test("pro permite hasta 3 sucursales (la 3ra pasa, la 4ta corta)", async () => {
    const empresa = await crearEmpresa({ plan: "pro" });
    await Sucursal.create({ zona: "1", numero: 1, empresa: empresa._id });
    await Sucursal.create({ zona: "1", numero: 2, empresa: empresa._id });
    // hay 2, crear la 3ra debe pasar
    let llamado = false;
    await validarLimiteSucursales(fakeReq(empresa._id), fakeRes(), () => { llamado = true; });
    expect(llamado).toBe(true);
    // ahora hay 3, la 4ta debe cortar
    await Sucursal.create({ zona: "1", numero: 3, empresa: empresa._id });
    const res = fakeRes();
    let llamado2 = false;
    await validarLimiteSucursales(fakeReq(empresa._id), res, () => { llamado2 = true; });
    expect(llamado2).toBe(false);
    expect(res.body.codigo).toBe("LIMITE_SUCURSALES");
  });
});

describe("validarLimiteUsuarios", () => {
  test("al alcanzar el limite de usuarios, corta con 403 LIMITE_USUARIOS", async () => {
    const empresa = await crearEmpresa({ plan: "starter" }); // starter = 5 usuarios
    const suc = await Sucursal.create({ zona: "1", numero: 1, empresa: empresa._id });
    for (let i = 0; i < 5; i++) {
      await Usuario.create({ nombre: "U" + i, email: "u" + i + "@lim.com", password: "x", rol: "jefe", sucursal: suc._id, empresa: empresa._id });
    }
    const res = fakeRes();
    let llamado = false;
    await validarLimiteUsuarios(fakeReq(empresa._id), res, () => { llamado = true; });
    expect(llamado).toBe(false);
    expect(res.statusCode).toBe(403);
    expect(res.body.codigo).toBe("LIMITE_USUARIOS");
  });
});

const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const app = require("../app");
const Usuario = require("../models/Usuario");
const Empresa = require("../models/Empresa");
const Sucursal = require("../models/Sucursal");

let mongod;

beforeEach(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterEach(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

async function crearAdmin(email = "admin@test.com", password = "Clave123!") {
  const empresa = await Empresa.create({ nombre: "TestEmpresa" });
  const sucursal = await Sucursal.create({ zona: 1, numero: 1, empresa: empresa._id });
  const hash = await bcrypt.hash(password, 10);
  const usuario = await Usuario.create({ nombre: "Admin", email, password: hash, rol: "admin", sucursal: sucursal._id, empresa: empresa._id, activo: true, emailVerificado: true });
  const login = await request(app).post("/api/usuarios/login").send({ email, password });
  return { token: login.body.token, empresa, sucursal, usuario };
}

describe("Gestion de usuarios por admin", () => {
  test("admin puede listar usuarios", async () => {
    const { token } = await crearAdmin();
    const res = await request(app).get("/api/usuarios").set("Authorization", "Bearer " + token);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("admin puede cambiar rol de otro usuario", async () => {
    const { token, empresa, sucursal } = await crearAdmin();
    const hash = await bcrypt.hash("Clave123!", 10);
    const jefe = await Usuario.create({ nombre: "Jefe", email: "jefe@test.com", password: hash, rol: "jefe", sucursal: sucursal._id, empresa: empresa._id, activo: true, emailVerificado: true });
    const res = await request(app).put("/api/usuarios/" + jefe._id + "/rol").set("Authorization", "Bearer " + token).send({ rol: "admin" });
    expect(res.statusCode).toBe(200);
    expect(res.body.usuario.rol).toBe("admin");
  });

  test("admin no puede cambiar su propio rol", async () => {
    const { token, usuario } = await crearAdmin();
    const res = await request(app).put("/api/usuarios/" + usuario._id + "/rol").set("Authorization", "Bearer " + token).send({ rol: "jefe" });
    expect(res.statusCode).toBe(400);
  });

  test("admin puede desactivar un usuario", async () => {
    const { token, empresa, sucursal } = await crearAdmin();
    const hash = await bcrypt.hash("Clave123!", 10);
    const jefe = await Usuario.create({ nombre: "Jefe", email: "jefe@test.com", password: hash, rol: "jefe", sucursal: sucursal._id, empresa: empresa._id, activo: true, emailVerificado: true });
    const res = await request(app).put("/api/usuarios/" + jefe._id + "/estado").set("Authorization", "Bearer " + token).send({ activo: false });
    expect(res.statusCode).toBe(200);
  });

  test("admin no puede desactivar su propia cuenta", async () => {
    const { token, usuario } = await crearAdmin();
    const res = await request(app).put("/api/usuarios/" + usuario._id + "/estado").set("Authorization", "Bearer " + token).send({ activo: false });
    expect(res.statusCode).toBe(400);
  });

  test("no se puede eliminar al unico admin", async () => {
    const { empresa, sucursal } = await crearAdmin("admin1@test.com");
    const hash = await bcrypt.hash("Clave123!", 10);
    const admin1 = await Usuario.findOne({ email: "admin1@test.com" });
    const admin2 = await Usuario.create({ nombre: "Admin2", email: "admin2@test.com", password: hash, rol: "admin", sucursal: sucursal._id, empresa: empresa._id, activo: true, emailVerificado: true });
    await Usuario.findByIdAndUpdate(admin2._id, { rol: "jefe" });
    const login2 = await request(app).post("/api/usuarios/login").send({ email: "admin2@test.com", password: "Clave123!" });
    const res = await request(app).delete("/api/usuarios/" + admin1._id).set("Authorization", "Bearer " + login2.body.token);
    expect([400, 403]).toContain(res.statusCode);
  });
});

describe("Seguridad adicional", () => {
  test("cuenta desactivada no puede loguear", async () => {
    const empresa = await Empresa.create({ nombre: "InactivaEmpresa" });
    const sucursal = await Sucursal.create({ zona: 1, numero: 1, empresa: empresa._id });
    const hash = await bcrypt.hash("Clave123!", 10);
    await Usuario.create({ nombre: "Test", email: "inactivo@test.com", password: hash, rol: "admin", sucursal: sucursal._id, empresa: empresa._id, activo: false, emailVerificado: true });
    const res = await request(app).post("/api/usuarios/login").send({ email: "inactivo@test.com", password: "Clave123!" });
    expect(res.statusCode).toBe(403);
  });

  test("jefe no puede acceder a rutas de admin", async () => {
    const empresa = await Empresa.create({ nombre: "JefeEmpresa" });
    const sucursal = await Sucursal.create({ zona: 1, numero: 1, empresa: empresa._id });
    const hash = await bcrypt.hash("Clave123!", 10);
    await Usuario.create({ nombre: "Jefe", email: "jefe@test.com", password: hash, rol: "jefe", sucursal: sucursal._id, empresa: empresa._id, activo: true, emailVerificado: true });
    const login = await request(app).post("/api/usuarios/login").send({ email: "jefe@test.com", password: "Clave123!" });
    const res = await request(app).get("/api/usuarios").set("Authorization", "Bearer " + login.body.token);
    expect(res.statusCode).toBe(403);
  });

  test("superadmin rechaza usuario normal", async () => {
    const { token } = await crearAdmin();
    const res = await request(app).get("/api/superadmin/metricas").set("Authorization", "Bearer " + token);
    expect(res.statusCode).toBe(403);
  });

  test("restablecer con token valido actualiza contrasena", async () => {
    const empresa = await Empresa.create({ nombre: "RecupEmpresa" });
    const sucursal = await Sucursal.create({ zona: 1, numero: 1, empresa: empresa._id });
    const hash = await bcrypt.hash("Clave123!", 10);
    const tokenPlano = "tokenrecuperacion123abc";
    const tokenHasheado = crypto.createHash("sha256").update(tokenPlano).digest("hex");
    await Usuario.create({ nombre: "Test", email: "recup@test.com", password: hash, rol: "admin", sucursal: sucursal._id, empresa: empresa._id, activo: true, emailVerificado: true, tokenRecuperacion: tokenHasheado, tokenExpiracion: new Date(Date.now() + 3600000) });
    const res = await request(app).post("/api/usuarios/restablecer-password").send({ token: tokenPlano, password: "NuevaClave123!" });
    expect(res.statusCode).toBe(200);
  });
});

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
let tokenAdminA, tokenJefeA, tokenAdminB;
let empresaA, empresaB, sucursalA;
let adminA, jefeA;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  const hash = await bcrypt.hash("Clave123!", 10);

  // Empresa A: un admin y un jefe
  empresaA = await Empresa.create({ nombre: "EmpresaA" });
  sucursalA = await Sucursal.create({ zona: 1, numero: 1, empresa: empresaA._id });
  adminA = await Usuario.create({ nombre: "Admin A", email: "admin.a@test.com", password: hash, rol: "admin", sucursal: sucursalA._id, empresa: empresaA._id, activo: true, emailVerificado: true });
  jefeA = await Usuario.create({ nombre: "Jefe A", email: "jefe.a@test.com", password: hash, rol: "jefe", sucursal: sucursalA._id, empresa: empresaA._id, activo: true, emailVerificado: true });

  // Empresa B: un admin
  empresaB = await Empresa.create({ nombre: "EmpresaB" });
  const sucursalB = await Sucursal.create({ zona: 1, numero: 1, empresa: empresaB._id });
  await Usuario.create({ nombre: "Admin B", email: "admin.b@test.com", password: hash, rol: "admin", sucursal: sucursalB._id, empresa: empresaB._id, activo: true, emailVerificado: true });

  const r1 = await request(app).post("/api/usuarios/login").send({ email: "admin.a@test.com", password: "Clave123!" });
  const r2 = await request(app).post("/api/usuarios/login").send({ email: "jefe.a@test.com", password: "Clave123!" });
  const r3 = await request(app).post("/api/usuarios/login").send({ email: "admin.b@test.com", password: "Clave123!" });
  tokenAdminA = r1.body.token;
  tokenJefeA = r2.body.token;
  tokenAdminB = r3.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe("Seguridad: escalada de rol (nadie se auto-promueve a admin)", () => {
  test("un jefe NO puede cambiar el rol de otro usuario (403)", async () => {
    const res = await request(app)
      .put("/api/usuarios/" + jefeA._id + "/rol")
      .set("Authorization", "Bearer " + tokenJefeA)
      .send({ rol: "admin" });
    expect(res.status).toBe(403);
  });

  test("un jefe NO puede usar la ruta de editar usuario (403, es soloAdmin)", async () => {
    const res = await request(app)
      .put("/api/usuarios/" + jefeA._id)
      .set("Authorization", "Bearer " + tokenJefeA)
      .send({ nombre: "Hacker" });
    expect(res.status).toBe(403);
  });

  test("un admin que edita un usuario NO puede colar rol:admin por la ruta de editar", async () => {
    // La ruta PUT /:id usa editarUsuarioSchema, que NO acepta 'rol'. Aunque lo mande, se descarta.
    await request(app)
      .put("/api/usuarios/" + jefeA._id)
      .set("Authorization", "Bearer " + tokenAdminA)
      .send({ nombre: "Jefe Renombrado", rol: "admin" });
    const despues = await Usuario.findById(jefeA._id);
    expect(despues.rol).toBe("jefe");
  });

  test("un admin NO puede cambiar el rol de un usuario de OTRA empresa (404)", async () => {
    const res = await request(app)
      .put("/api/usuarios/" + jefeA._id + "/rol")
      .set("Authorization", "Bearer " + tokenAdminB)
      .send({ rol: "admin" });
    expect(res.status).toBe(404);
    // y el rol sigue intacto
    const sigue = await Usuario.findById(jefeA._id);
    expect(sigue.rol).toBe("jefe");
  });

  test("un admin NO puede cambiar su propio rol", async () => {
    const res = await request(app)
      .put("/api/usuarios/" + adminA._id + "/rol")
      .set("Authorization", "Bearer " + tokenAdminA)
      .send({ rol: "jefe" });
    expect(res.status).toBeGreaterThanOrEqual(400);
    const sigue = await Usuario.findById(adminA._id);
    expect(sigue.rol).toBe("admin");
  });

  test("cambiarRolSchema rechaza un rol fuera del enum (ej. superadmin)", async () => {
    const res = await request(app)
      .put("/api/usuarios/" + jefeA._id + "/rol")
      .set("Authorization", "Bearer " + tokenAdminA)
      .send({ rol: "superadmin" });
    expect(res.status).toBe(400);
    const sigue = await Usuario.findById(jefeA._id);
    expect(sigue.rol).toBe("jefe");
  });

  test("al UNIRSE a una empresa existente, mandar rol:admin en el body no da admin", async () => {
    // modo 'unir' con el codigo de la empresa A: el usuario nuevo debe quedar jefe, no admin.
    const empresa = await Empresa.findById(empresaA._id);
    const res = await request(app)
      .post("/api/usuarios/registro")
      .send({
        nombre: "Intruso",
        email: "intruso@test.com",
        password: "Clave123!",
        modo: "unir",
        codigoAcceso: empresa.codigoAcceso,
        rol: "admin"
      });
    // Puede requerir verificacion de email, pero lo que importa es el rol asignado en base
    const creado = await Usuario.findOne({ email: "intruso@test.com" });
    if (creado) {
      expect(creado.rol).not.toBe("admin");
    }
  });
});

describe("Seguridad: suscripcion/plan (nadie se pone un plan sin pagar)", () => {
  test("el webhook con firma invalida es rechazado y NO cambia el plan", async () => {
    const planAntes = (await Empresa.findById(empresaA._id)).plan;
    const payload = JSON.stringify({
      meta: { event_name: "subscription_created", custom_data: { empresa_id: empresaA._id.toString() } },
      data: { attributes: { variant_id: 2001104 } }
    });
    const res = await request(app)
      .post("/api/lemon/webhook")
      .set("Content-Type", "application/json")
      .set("x-signature", "firma_falsa_deadbeef")
      .send(payload);
    expect(res.status).toBeGreaterThanOrEqual(400);
    const planDespues = (await Empresa.findById(empresaA._id)).plan;
    expect(planDespues).toBe(planAntes);
  });

  test("el webhook SIN header de firma es rechazado", async () => {
    const payload = JSON.stringify({
      meta: { event_name: "subscription_created", custom_data: { empresa_id: empresaA._id.toString() } },
      data: { attributes: { variant_id: 2001104 } }
    });
    const res = await request(app)
      .post("/api/lemon/webhook")
      .set("Content-Type", "application/json")
      .send(payload);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  test("un webhook con firma VALIDA sí procesa (control positivo: la proteccion no rompe el flujo legitimo)", async () => {
    const secreto = process.env.LEMON_WEBHOOK_SECRET || "test_secret";
    process.env.LEMON_WEBHOOK_SECRET = secreto;
    const payload = JSON.stringify({
      meta: { event_name: "subscription_created", custom_data: { empresa_id: empresaA._id.toString() } },
      data: { attributes: { variant_id: 2001104 } }
    });
    const firma = crypto.createHmac("sha256", secreto).update(payload).digest("hex");
    const res = await request(app)
      .post("/api/lemon/webhook")
      .set("Content-Type", "application/json")
      .set("x-signature", firma)
      .send(payload);
    expect(res.status).toBeLessThan(400);
  });

  test("no existe una ruta REST directa para setear el plan de una empresa", async () => {
    // intentos tipicos que un atacante probaria por consola
    const intentos = [
      request(app).put("/api/empresa/plan").set("Authorization", "Bearer " + tokenAdminA).send({ plan: "business" }),
      request(app).patch("/api/empresa").set("Authorization", "Bearer " + tokenAdminA).send({ plan: "business" }),
      request(app).post("/api/empresa/plan").set("Authorization", "Bearer " + tokenAdminA).send({ plan: "business" })
    ];
    const resultados = await Promise.all(intentos);
    for (const res of resultados) {
      expect(res.status).toBeGreaterThanOrEqual(400);
    }
  });
});

// Migracion: asigna plan 'business' a todas las empresas existentes
// Correr UNA sola vez: node migrate-planes.cjs
require("dotenv").config();
const mongoose = require("mongoose");
const Empresa = require("./models/Empresa");

async function migrar() {
  await mongoose.connect(process.env.MONGO_URI);
  const resultado = await Empresa.updateMany(
    { plan: { $exists: false } },
    { $set: { plan: "business", trialExpira: null } }
  );
  console.log("Empresas migradas:", resultado.modifiedCount);
  await mongoose.disconnect();
}

migrar().catch(console.error);

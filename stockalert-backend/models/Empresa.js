const mongoose = require("mongoose");

// Planes disponibles y sus limites
const PLANES = ["free", "starter", "pro", "business"];

const empresaSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    codigoAcceso: { type: String, unique: true, sparse: true },
    activa: { type: Boolean, default: true },
    plan: { type: String, enum: PLANES, default: "business" },
    trialExpira: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Empresa", empresaSchema);

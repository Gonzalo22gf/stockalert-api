const mongoose = require("mongoose");

const usuarioSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    rol: { type: String, enum: ["admin", "jefe"], default: "jefe" },
    sucursal: { type: mongoose.Schema.Types.ObjectId, ref: "Sucursal", required: true },
    empresa: { type: mongoose.Schema.Types.ObjectId, ref: "Empresa" },
    activo: { type: Boolean, default: true },
    passwordVersion: { type: Number, default: 0 },
    intentosFallidos: { type: Number, default: 0 },
    bloqueadoHasta: { type: Date, default: null },
    tokenRecuperacion: { type: String, default: null },
    tokenExpiracion: { type: Date, default: null },
    // Verificacion de email al registro
    emailVerificado: { type: Boolean, default: false },
    tokenVerificacion: { type: String, default: null },
    tokenVerificacionExpira: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Usuario", usuarioSchema);

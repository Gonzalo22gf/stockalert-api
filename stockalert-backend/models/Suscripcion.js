const mongoose = require("mongoose");

const suscripcionSchema = new mongoose.Schema(
  {
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    empresa: { type: mongoose.Schema.Types.ObjectId, ref: "Empresa", required: true },
    token: { type: String, required: true },
    dispositivo: { type: String, default: "web" }
  },
  { timestamps: true }
);

// Un usuario puede tener multiples dispositivos pero no tokens duplicados
suscripcionSchema.index({ token: 1 }, { unique: true });

module.exports = mongoose.model("Suscripcion", suscripcionSchema);

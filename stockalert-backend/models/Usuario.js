const mongoose = require("mongoose");

const usuarioSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    rol: {
      type: String,
      enum: ["admin", "jefe"],
      default: "jefe"
    },
    sucursal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sucursal",
      required: true
    },
    empresa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Empresa"
    },
    activo: {
      type: Boolean,
      default: true
    },
    // Anti fuerza bruta: bloqueo temporal por intentos fallidos
    intentosFallidos: {
      type: Number,
      default: 0
    },
    bloqueadoHasta: {
      type: Date,
      default: null
    },
    // Recuperacion de contrasena por correo
    tokenRecuperacion: {
      type: String,
      default: null
    },
    tokenExpiracion: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Usuario", usuarioSchema);

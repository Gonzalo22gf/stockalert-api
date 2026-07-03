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
    activo: {
      type: Boolean,
      default: true
    },
    // Recuperación de contraseña por correo
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

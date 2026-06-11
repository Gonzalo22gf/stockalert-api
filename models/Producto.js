const mongoose = require("mongoose");

const productoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true
    },
    categoria: {
      type: String,
      required: true
    },
    stock: {
      type: Number,
      required: true,
      min: 0
    },
    precio: {
      type: Number,
      required: true,
      min: 0
    },
    vencimiento: {
      type: Date,
      required: true
    },
    codigoBarras: {
      type: String,
      trim: true
    },
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true
    },
    sucursal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sucursal",
      required: true
    },

    creadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario"
    },
    actualizadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario"
    },
    fechaUltimaActualizacion: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Producto", productoSchema);
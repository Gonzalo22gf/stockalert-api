const mongoose = require("mongoose");

const movimientoSchema = new mongoose.Schema(
  {
    producto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Producto"
    },

    nombreProducto: {
      type: String,
      required: true
    },

    lote: {
      type: String,
      default: ""
    },

    accion: {
      type: String,
      enum: ["CREAR", "EDITAR", "ELIMINAR"],
      required: true
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

    detalle: {
      type: String,
      default: ""
    },

    cambios: {
      type: Object,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Movimiento", movimientoSchema);
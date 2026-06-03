const mongoose = require("mongoose");

const sucursalSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true
    },
    direccion: {
      type: String,
      trim: true
    },
    empresa: {
      type: String,
      default: "Carrefour"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Sucursal", sucursalSchema);
const mongoose = require("mongoose");

const sucursalSchema = new mongoose.Schema(
  {
    zona: {
      type: Number,
      required: true
    },
    numero: {
      type: Number,
      required: true,
      unique: true
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
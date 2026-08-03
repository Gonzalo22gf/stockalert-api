const mongoose = require("mongoose");

// Cada empresa es un "espacio aislado": sus usuarios, sucursales y productos
// no se mezclan jamas con los de otra empresa.
const empresaSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true
    },
    activa: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Empresa", empresaSchema);

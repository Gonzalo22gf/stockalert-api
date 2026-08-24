const mongoose = require("mongoose");
const categoriaSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true
    },
    empresa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Empresa"
    }
  },
  {
    timestamps: true
  }
);
// El nombre de categoria es unico DENTRO de cada empresa (no global):
// una despensa puede tener "Lacteos" y una textil "Telas" sin chocar.
categoriaSchema.index({ empresa: 1, nombre: 1 }, { unique: true });
module.exports = mongoose.model("Categoria", categoriaSchema);

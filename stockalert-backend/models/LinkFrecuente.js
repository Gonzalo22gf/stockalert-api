const mongoose = require("mongoose");

const linkSchema = new mongoose.Schema(
  {
    empresa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Empresa",
      required: true
    },
    nombre: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    orden: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// Max 10 links por empresa (se valida en el controller)
module.exports = mongoose.model("LinkFrecuente", linkSchema);

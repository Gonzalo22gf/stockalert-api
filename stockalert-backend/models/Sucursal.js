const mongoose = require("mongoose");

const sucursalSchema = new mongoose.Schema(
  {
    zona: {
      type: Number,
      required: true
    },
    numero: {
      type: Number,
      required: true
    },
    direccion: {
      type: String,
      trim: true
    },
    empresa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Empresa"
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// El numero de sucursal es unico DENTRO de cada empresa (no global):
// Carrefour y Coto pueden tener ambos la tienda 402.
sucursalSchema.index({ empresa: 1, numero: 1 }, { unique: true });

sucursalSchema.virtual("nombre").get(function () {
  return `Zona ${this.zona}, ${this.numero}`;
});

module.exports = mongoose.model("Sucursal", sucursalSchema);

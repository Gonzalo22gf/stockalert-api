const mongoose = require("mongoose");

const loteSchema = new mongoose.Schema(
  {
    numero: {
      type: String,
      trim: true,
      default: ""
    },
    stock: {
      type: Number,
      required: true,
      min: 0
    },
    vencimiento: {
      type: Date,
      required: true,
      validate: {
        validator: function (valor) {
          const limite = new Date();
          limite.setFullYear(limite.getFullYear() + 5);
          return valor <= limite;
        },
        message: "La fecha de vencimiento no puede ser mayor a 5 años desde hoy"
      }
    }
  },
  {
    _id: true
  }
);

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
      min: 0,
      default: 0
    },
    precio: {
      type: Number,
      required: true,
      min: 0
    },
    vencimiento: {
      type: Date,
      required: true,
      validate: {
        validator: function (valor) {
          const limite = new Date();
          limite.setFullYear(limite.getFullYear() + 5);
          return valor <= limite;
        },
        message: "La fecha de vencimiento no puede ser mayor a 5 años desde hoy"
      }
    },
    codigoBarras: {
      type: String,
      trim: true
    },

    lote: {
      type: String,
      trim: true,
      default: ""
    },

    lotes: {
      type: [loteSchema],
      default: []
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

productoSchema.pre("validate", function (next) {
  if (this.lotes && this.lotes.length > 0) {
    this.stock = this.lotes.reduce((total, lote) => {
      return total + Number(lote.stock || 0);
    }, 0);

    const lotesConFecha = this.lotes
      .filter((lote) => lote.vencimiento)
      .sort((a, b) => new Date(a.vencimiento) - new Date(b.vencimiento));

    if (lotesConFecha.length > 0) {
      this.vencimiento = lotesConFecha[0].vencimiento;
    }

    this.lote = this.lotes[0].numero || "";
  }

  next();
});

module.exports = mongoose.model("Producto", productoSchema);
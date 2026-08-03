const mongoose = require("mongoose");

// Estructura de conteo por categoría (cantidad de productos de cada una)
const categoriasSchema = {
  Lácteos: { type: Number, default: 0 },
  Bebidas: { type: Number, default: 0 },
  Almacén: { type: Number, default: 0 },
  Limpieza: { type: Number, default: 0 },
  Congelados: { type: Number, default: 0 },
  Otros: { type: Number, default: 0 }
};

// Cada snapshot es una "foto" del estado de todas las sucursales de UNA empresa en un día.
const snapshotSchema = new mongoose.Schema(
  {
    empresa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Empresa"
    },
    fecha: {
      type: Date,
      required: true,
      index: true
    },
    diaClave: {
      type: String,
      required: true
    },
    totales: {
      tiendas: { type: Number, default: 0 },
      totalProductos: { type: Number, default: 0 },
      vencidos: { type: Number, default: 0 },
      porVencer: { type: Number, default: 0 },
      stockCritico: { type: Number, default: 0 },
      agotados: { type: Number, default: 0 },
      valorInventario: { type: Number, default: 0 },
      categorias: categoriasSchema
    },
    sucursales: [
      {
        sucursalId: { type: mongoose.Schema.Types.ObjectId, ref: "Sucursal" },
        nombre: String,
        zona: Number,
        numero: Number,
        totalProductos: Number,
        vencidos: Number,
        porVencer: Number,
        stockCritico: Number,
        agotados: Number,
        valorInventario: Number,
        categorias: categoriasSchema
      }
    ]
  },
  {
    timestamps: true
  }
);

// Un snapshot por dia POR EMPRESA (cada empresa tiene su foto diaria propia).
snapshotSchema.index({ empresa: 1, diaClave: 1 }, { unique: true });

module.exports = mongoose.model("Snapshot", snapshotSchema);

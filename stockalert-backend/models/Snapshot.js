const mongoose = require("mongoose");

// Cada snapshot es una "foto" del estado de todas las sucursales en un día concreto.
const snapshotSchema = new mongoose.Schema(
  {
    // Fecha del día capturado (a medianoche, para agrupar por día)
    fecha: {
      type: Date,
      required: true,
      index: true
    },
    // Clave de día en formato YYYY-MM-DD, para evitar duplicados del mismo día
    diaClave: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    // Totales globales (suma de todas las sucursales)
    totales: {
      tiendas: { type: Number, default: 0 },
      totalProductos: { type: Number, default: 0 },
      vencidos: { type: Number, default: 0 },
      porVencer: { type: Number, default: 0 },
      stockCritico: { type: Number, default: 0 },
      agotados: { type: Number, default: 0 },
      valorInventario: { type: Number, default: 0 }
    },
    // Detalle tienda por tienda
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
        valorInventario: Number
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Snapshot", snapshotSchema);

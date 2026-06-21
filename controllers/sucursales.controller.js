const Sucursal = require("../models/Sucursal");
const Producto = require("../models/Producto");

// LISTAR TODAS
const obtenerSucursales = async (req, res) => {
  try {
    const sucursales = await Sucursal.find().sort({ numero: 1 });
    res.json(sucursales);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener sucursales" });
  }
};

// RESUMEN (solo admin)
const obtenerResumenSucursales = async (req, res) => {
  try {
    if (req.usuario.rol !== "admin") {
      return res.status(403).json({ mensaje: "No autorizado" });
    }

    const sucursales = await Sucursal.find().sort({ numero: 1 });
    const hoy = new Date();

    const resumen = await Promise.all(
      sucursales.map(async (sucursal) => {
        const productos = await Producto.find({ sucursal: sucursal._id });

        const totalProductos = productos.length;

        const vencidos = productos.filter((p) => new Date(p.vencimiento) < hoy).length;

        const porVencer = productos.filter((p) => {
          const diff = Math.ceil((new Date(p.vencimiento) - hoy) / (1000 * 60 * 60 * 24));
          return diff >= 0 && diff <= 7;
        }).length;

        const stockCritico = productos.filter((p) => p.stock > 0 && p.stock <= 5).length;
        const agotados     = productos.filter((p) => p.stock === 0).length;
        const valorInventario = productos.reduce((t, p) => t + p.stock * p.precio, 0);

        return {
          sucursal: {
            _id:       sucursal._id,
            zona:      sucursal.zona,
            numero:    sucursal.numero,
            nombre:    sucursal.nombre,
            direccion: sucursal.direccion,
            empresa:   sucursal.empresa
          },
          totalProductos,
          vencidos,
          porVencer,
          stockCritico,
          agotados,
          valorInventario
        };
      })
    );

    res.json(resumen);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener resumen de sucursales" });
  }
};

// CREAR SUCURSAL (solo admin)
const crearSucursal = async (req, res) => {
  try {
    const { zona, numero, direccion, empresa } = req.body;

    if (zona === undefined || zona === null || numero === undefined || numero === null) {
      return res.status(400).json({ mensaje: "Zona y número son obligatorios" });
    }

    const yaExiste = await Sucursal.findOne({ numero: Number(numero) });
    if (yaExiste) {
      return res.status(400).json({ mensaje: "Ya existe una sucursal con ese número" });
    }

    const sucursal = await Sucursal.create({
      zona: Number(zona),
      numero: Number(numero),
      direccion: direccion?.trim() || "",
      empresa: empresa?.trim() || "Carrefour"
    });

    res.status(201).json({ mensaje: "Sucursal creada", sucursal });
  } catch (error) {
    console.error("ERROR CREAR SUCURSAL:", error);
    res.status(500).json({ mensaje: error.message || "Error al crear sucursal" });
  }
};

// EDITAR SUCURSAL (solo admin)
const editarSucursal = async (req, res) => {
  try {
    const { zona, numero, direccion } = req.body;

    if (zona === undefined || zona === null || numero === undefined || numero === null) {
      return res.status(400).json({ mensaje: "Zona y número son obligatorios" });
    }

    const sucursal = await Sucursal.findByIdAndUpdate(
      req.params.id,
      {
        zona: Number(zona),
        numero: Number(numero),
        direccion: direccion?.trim() || ""
      },
      { new: true, runValidators: true }
    );

    if (!sucursal) {
      return res.status(404).json({ mensaje: "Sucursal no encontrada" });
    }

    res.json({ mensaje: "Sucursal actualizada", sucursal });
  } catch (error) {
    console.error("ERROR EDITAR SUCURSAL:", error);
    res.status(500).json({ mensaje: "Error al editar sucursal" });
  }
};

module.exports = {
  obtenerSucursales,
  obtenerResumenSucursales,
  crearSucursal,
  editarSucursal
};
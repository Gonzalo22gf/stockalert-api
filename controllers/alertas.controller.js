const Producto = require("../models/Producto");
const Usuario = require("../models/Usuario");
const enviarEmail = require("../services/email.service");

const enviarAlertasDiarias = async (req, res) => {
  try {
    const usuarios = await Usuario.find().populate("sucursal");

    let emailsEnviados = 0;

    for (const usuario of usuarios) {
      if (!usuario.sucursal?._id) {
        console.log(`Usuario sin sucursal: ${usuario.email}`);
        continue;
      }

      const hoy = new Date();

      const limite = new Date();
      limite.setDate(hoy.getDate() + 7);

      const productos = await Producto.find({
        sucursal: usuario.sucursal._id
      });

      const vencidos = productos.filter((producto) => {
        return new Date(producto.vencimiento) < hoy;
      });

      const porVencer = productos.filter((producto) => {
        const fecha = new Date(producto.vencimiento);
        return fecha >= hoy && fecha <= limite;
      });

      const stockCritico = productos.filter((producto) => {
        return producto.stock > 0 && producto.stock <= 5;
      });

      const agotados = productos.filter((producto) => {
        return producto.stock === 0;
      });

      if (
        vencidos.length === 0 &&
        porVencer.length === 0 &&
        stockCritico.length === 0 &&
        agotados.length === 0
      ) {
        continue;
      }

      const html = `
        <h2>🚨 Alerta diaria StockAlert</h2>

        <p><strong>Sucursal:</strong> ${usuario.sucursal.nombre}</p>

        <hr>

        <p>❌ <strong>Productos vencidos:</strong> ${vencidos.length}</p>
        <p>⚠️ <strong>Productos por vencer en 7 días:</strong> ${porVencer.length}</p>
        <p>📉 <strong>Stock crítico:</strong> ${stockCritico.length}</p>
        <p>🚫 <strong>Productos agotados:</strong> ${agotados.length}</p>

        <hr>

        <h3>Detalle vencidos</h3>
        <ul>
          ${
            vencidos.length > 0
              ? vencidos.map((p) => `<li>${p.nombre} - Stock: ${p.stock}</li>`).join("")
              : "<li>No hay productos vencidos</li>"
          }
        </ul>

        <h3>Detalle por vencer</h3>
        <ul>
          ${
            porVencer.length > 0
              ? porVencer
                  .map(
                    (p) =>
                      `<li>${p.nombre} - Vence: ${new Date(
                        p.vencimiento
                      ).toLocaleDateString("es-AR")}</li>`
                  )
                  .join("")
              : "<li>No hay productos por vencer</li>"
          }
        </ul>

        <h3>Detalle stock crítico</h3>
        <ul>
          ${
            stockCritico.length > 0
              ? stockCritico.map((p) => `<li>${p.nombre} - Stock: ${p.stock}</li>`).join("")
              : "<li>No hay productos con stock crítico</li>"
          }
        </ul>

        <p>Este aviso fue generado automáticamente por StockAlert.</p>
      `;

      console.log("EMAIL DESTINO REAL:", process.env.EMAIL_ALERTAS);
      console.log("USUARIO ORIGINAL:", usuario.email);
      console.log("SUCURSAL:", usuario.sucursal.nombre);

      await enviarEmail({
        para: process.env.EMAIL_ALERTAS,
        asunto: "StockAlert - Alerta diaria de productos",
        html
      });

      emailsEnviados++;
    }

    res.json({
      mensaje: "Alertas enviadas correctamente",
      emailsEnviados
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: "Error al enviar alertas diarias",
      error: error.message
    });
  }
};

module.exports = {
  enviarAlertasDiarias
};
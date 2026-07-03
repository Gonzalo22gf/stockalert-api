const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");

dotenv.config();

const app = express();

// Render usa un proxy: confiar en él para que el rate-limit lea bien la IP
app.set("trust proxy", 1);

// ───────────────────────────────
// SEGURIDAD
// ───────────────────────────────
app.use(helmet());

const origenesPermitidos = [
  "http://localhost:5173",
  "https://gonzalo22gf.github.io"
];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || origenesPermitidos.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(mongoSanitize());

const limiteGeneral = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { mensaje: "Demasiadas solicitudes, intentá de nuevo más tarde." }
});
app.use(limiteGeneral);

// ───────────────────────────────
// RUTAS
// ───────────────────────────────
app.get("/", (req, res) => {
  res.send("API StockAlert funcionando correctamente");
});

app.use("/api/usuarios", require("./routes/usuarios.routes"));
app.use("/api/usuarios", require("./routes/recuperacion.routes"));
app.use("/api/productos", require("./routes/productos.routes"));
app.use("/api/alertas", require("./routes/alertas.routes"));
app.use("/api/sucursales", require("./routes/sucursales.routes"));
app.use("/api/snapshots", require("./routes/snapshots.routes"));
app.use("/api/movimientos", require("./routes/movimientos.routes"));

// Documentación interactiva de la API (Swagger)
const swaggerUi = require("swagger-ui-express");
const especificacionSwagger = require("./config/swagger");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(especificacionSwagger));

module.exports = app;

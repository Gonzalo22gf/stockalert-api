const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const conectarDB = require("./config/db");

dotenv.config();

const app = express();
// Render usa un proxy: confiar en él para que el rate-limit lea bien la IP
app.set("trust proxy", 1);

conectarDB();

// ───────────────────────────────
// SEGURIDAD
// ───────────────────────────────

// Headers de seguridad HTTP
app.use(helmet());

// CORS restringido a orígenes permitidos
const origenesPermitidos = [
  "http://localhost:5173",
  "https://gonzalo22gf.github.io"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Permite requests sin origin (Postman, apps móviles, health checks) y los de la lista
      if (!origin || origenesPermitidos.includes(origin)) {
        callback(null, true);
      } else {
        // No autoriza, pero sin tirar error que rompa la cadena
        callback(null, false);
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Límite de tamaño del body (evita payloads gigantes)
app.use(express.json({ limit: "1mb" }));

// Sanitización contra inyección NoSQL ($gt, $ne, etc.)
app.use(mongoSanitize());

// Rate limit general: máximo 200 requests por IP cada 15 min
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
app.use("/api/productos", require("./routes/productos.routes"));
app.use("/api/alertas", require("./routes/alertas.routes"));
app.use("/api/sucursales", require("./routes/sucursales.routes"));
app.use("/api/snapshots", require("./routes/snapshots.routes"));

// Documentación interactiva de la API (Swagger)
const swaggerUi = require("swagger-ui-express");
const especificacionSwagger = require("./config/swagger");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(especificacionSwagger));
app.use("/api/movimientos", require("./routes/movimientos.routes"));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
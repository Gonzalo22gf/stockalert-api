const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");

dotenv.config();

const app = express();

// Render usa un proxy: confiar en él para que el rate-limit lea bien la IP
app.set("trust proxy", 1);

// ───────────────────────────────
// SEGURIDAD
// ───────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.mistockalert.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false
}));

const origenesPermitidos = [
  "http://localhost:5173",
  "https://gonzalo22gf.github.io",
  "https://mistockalert.com",
  "https://app.mistockalert.com",
  "https://www.mistockalert.com"
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
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use((req, res, next) => {
  express.json({
    limit: "1mb",
    strict: true, // Solo acepta arrays y objetos — no strings o numeros en el root
    verify: (req, res, buf) => {
      req.rawBody = buf;
      // Limitar profundidad de anidacion JSON
      try {
        const parsed = JSON.parse(buf.toString());
        const profundidad = (obj, nivel = 0) => {
          if (nivel > 10) throw new Error("JSON demasiado anidado");
          if (typeof obj === "object" && obj !== null) {
            Object.values(obj).forEach((v) => profundidad(v, nivel + 1));
          }
        };
        profundidad(parsed);
      } catch (e) {
        if (e.message === "JSON demasiado anidado") {
          throw e;
        }
      }
    }
  })(req, res, next);
});
app.use(mongoSanitize());
app.use(hpp()); // Previene HTTP Parameter Pollution

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
app.use("/api/links", require("./routes/links.routes"));
app.use("/api/empresa", require("./routes/empresa.routes"));
app.use("/api/superadmin", require("./routes/superadmin.routes"));
app.use("/api/lemon", require("./routes/lemon.routes"));
app.use("/api/push", require("./routes/push.routes"));

// Documentación interactiva de la API (Swagger)
const swaggerUi = require("swagger-ui-express");
const especificacionSwagger = require("./config/swagger");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(especificacionSwagger));

// Manejo centralizado de errores (SIEMPRE al final)
app.use(require('./middleware/errorHandler'));

module.exports = app;

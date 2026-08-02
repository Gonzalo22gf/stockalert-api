// Logger centralizado con Pino.
// En desarrollo (con pino-pretty instalado): logs legibles y con color.
// En produccion (sin pino-pretty): logs en JSON estructurado, ideal para Render.
const pino = require("pino");

let opciones = {};
try {
  require.resolve("pino-pretty");
  if (process.env.NODE_ENV !== "production") {
    opciones = {
      transport: {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" }
      }
    };
  }
} catch (e) {
  // pino-pretty no esta instalado (produccion): se loguea en JSON plano
}

const base = pino(opciones);

// Convierte cualquier argumento a texto util (los Error muestran su stack)
function aTexto(v) {
  if (v instanceof Error) return v.stack || v.message;
  if (typeof v === "object" && v !== null) {
    try { return JSON.stringify(v); } catch { return String(v); }
  }
  return String(v);
}

// Interfaz compatible con console.log/error: acepta varios argumentos
module.exports = {
  info: (...args) => base.info(args.map(aTexto).join(" ")),
  warn: (...args) => base.warn(args.map(aTexto).join(" ")),
  error: (...args) => base.error(args.map(aTexto).join(" "))
};

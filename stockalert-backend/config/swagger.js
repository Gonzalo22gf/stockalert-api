const swaggerJsdoc = require("swagger-jsdoc");

const opciones = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "StockAlert API",
      version: "1.0.0",
      description: "API REST del sistema de inventario y control de vencimientos multi-sucursal StockAlert. La mayoria de los endpoints requieren autenticacion JWT (header Authorization: Bearer <token>)."
    },
    servers: [
      { url: "https://stockalert-api.onrender.com", description: "Produccion (Render)" },
      { url: "http://localhost:3000", description: "Desarrollo local" }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    }
  },
  apis: ["./routes/*.js"]
};

module.exports = swaggerJsdoc(opciones);

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const conectarDB = require("./config/db");

dotenv.config();

const app = express();

conectarDB();

app.use(
  cors({
    origin: [
      "https://gonzalo22gf.github.io",
      "http://localhost:5500",
      "http://127.0.0.1:5500"
    ],
    credentials: true
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("API StockAlert funcionando correctamente");
});

app.use("/api/usuarios", require("./routes/usuarios.routes"));
app.use("/api/productos", require("./routes/productos.routes"));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
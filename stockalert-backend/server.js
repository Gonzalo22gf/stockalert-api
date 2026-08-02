const logger = require("./utils/logger");
const app = require("./app");
const conectarDB = require("./config/db");

conectarDB();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info("Servidor corriendo en puerto " + PORT);
});

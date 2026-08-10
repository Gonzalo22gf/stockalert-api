const express = require("express");
const router = express.Router();
const { enviarAlertasDiarias } = require("../controllers/alertas.controller");
const { protegerCron } = require("../middleware/protegerCron");

router.post("/enviar-diarias", protegerCron, enviarAlertasDiarias);

module.exports = router;

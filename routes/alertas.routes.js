const express = require("express");
const router = express.Router();

const {
  enviarAlertasDiarias
} = require("../controllers/alertas.controller");

router.get("/enviar-diarias", enviarAlertasDiarias);

module.exports = router;
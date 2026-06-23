const express = require("express");
const router = express.Router();

const { protegerRuta } = require("../middleware/auth");

// Importá tu controller de alertas si existe
// const { ... } = require("../controllers/alertas.controller");

// router.get("/", protegerRuta, ...);

module.exports = router;
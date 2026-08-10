const express = require("express");
const router = express.Router();
const { protegerRuta } = require("../middleware/auth");
const { suscribir, desuscribir } = require("../controllers/push.controller");

router.post("/suscribir", protegerRuta, suscribir);
router.post("/desuscribir", protegerRuta, desuscribir);

module.exports = router;

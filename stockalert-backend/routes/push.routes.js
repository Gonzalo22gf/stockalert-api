const express = require("express");
const router = express.Router();
const { protegerRuta } = require("../middleware/auth");
const validar = require("../middleware/validar");
const { pushTokenSchema } = require("../validators/index");
const { suscribir, desuscribir } = require("../controllers/push.controller");

router.post("/suscribir", protegerRuta, validar(pushTokenSchema), suscribir);
router.post("/desuscribir", protegerRuta, validar(pushTokenSchema), desuscribir);

module.exports = router;

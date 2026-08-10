const express = require("express");
const router = express.Router();
const { protegerRuta } = require("../middleware/auth");
const validar = require("../middleware/validar");
const { z } = require("zod");
const { crearCheckout, webhook } = require("../controllers/lemon.controller");

const checkoutSchema = z.object({
  plan: z.enum(["starter", "pro", "business"], { errorMap: () => ({ message: "Plan invalido" }) })
});

// El webhook no usa JWT — viene de Lemon Squeezy directamente
router.post("/webhook", webhook);
// El checkout requiere estar logueado
router.post("/checkout", protegerRuta, validar(checkoutSchema), crearCheckout);

module.exports = router;

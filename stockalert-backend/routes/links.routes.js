const express = require("express");
const router = express.Router();
const validar = require("../middleware/validar");
const { linkSchema } = require("../validators/index");
const { protegerRuta } = require("../middleware/auth");
const { listarLinks, crearLink, editarLink, borrarLink } = require("../controllers/links.controller");

router.get("/", protegerRuta, listarLinks);
router.post("/", protegerRuta, validar(linkSchema), crearLink);
router.put("/:id", protegerRuta, validar(linkSchema), editarLink);
router.delete("/:id", protegerRuta, borrarLink);

module.exports = router;

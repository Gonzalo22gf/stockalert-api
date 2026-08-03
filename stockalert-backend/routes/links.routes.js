const express = require("express");
const router = express.Router();
const { protegerRuta } = require("../middleware/auth");
const { listarLinks, crearLink, editarLink, borrarLink } = require("../controllers/links.controller");

router.get("/", protegerRuta, listarLinks);
router.post("/", protegerRuta, crearLink);
router.put("/:id", protegerRuta, editarLink);
router.delete("/:id", protegerRuta, borrarLink);

module.exports = router;

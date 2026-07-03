const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const {
  registrarUsuario,
  loginUsuario,
  obtenerPerfil,
  listarUsuarios,
  cambiarRol,
  cambiarEstado,
  cambiarSucursal,
  editarUsuarioAdmin,
  eliminarUsuario
} = require("../controllers/usuarios.controller");
const { protegerRuta, soloAdmin } = require("../middleware/auth");

// Rate limit estricto SOLO para login/registro (anti fuerza bruta)
const limiteAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { mensaje: "Demasiados intentos de acceso. Esperá 15 minutos." }
});

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: Autenticación y gestión de usuarios
 */

/**
 * @swagger
 * /api/usuarios/registro:
 *   post:
 *     summary: Registrar un nuevo usuario (se une a una sucursal existente)
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, email, password, sucursal]
 *             properties:
 *               nombre: { type: string, example: "Juan Pérez" }
 *               email: { type: string, example: "juan@email.com" }
 *               password: { type: string, example: "123456" }
 *               sucursal: { type: number, example: 402, description: "Número de la sucursal a la que se une" }
 *     responses:
 *       201: { description: "Usuario creado, devuelve token JWT y datos" }
 *       400: { description: "Datos inválidos o email ya registrado" }
 *       429: { description: "Demasiados intentos (rate limit)" }
 */
router.post("/registro", limiteAuth, registrarUsuario);

/**
 * @swagger
 * /api/usuarios/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: "admin@email.com" }
 *               password: { type: string, example: "123456" }
 *     responses:
 *       200: { description: "Login exitoso, devuelve token JWT y datos del usuario" }
 *       401: { description: "Credenciales inválidas" }
 *       429: { description: "Demasiados intentos (rate limit)" }
 */
router.post("/login", limiteAuth, loginUsuario);

/**
 * @swagger
 * /api/usuarios/perfil:
 *   get:
 *     summary: Obtener el perfil del usuario autenticado
 *     tags: [Usuarios]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Datos del usuario autenticado" }
 *       401: { description: "Token faltante o inválido" }
 */
router.get("/perfil", protegerRuta, obtenerPerfil);

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: Listar todos los usuarios (solo admin)
 *     tags: [Usuarios]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Lista de usuarios" }
 *       403: { description: "No autorizado (requiere rol admin)" }
 */
router.get("/", protegerRuta, soloAdmin, listarUsuarios);

/**
 * @swagger
 * /api/usuarios/{id}/rol:
 *   put:
 *     summary: Cambiar el rol de un usuario (solo admin)
 *     tags: [Usuarios]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rol: { type: string, enum: [admin, jefe], example: "jefe" }
 *     responses:
 *       200: { description: "Rol actualizado" }
 *       403: { description: "No autorizado" }
 *       404: { description: "Usuario no encontrado" }
 */
router.put("/:id/rol", protegerRuta, soloAdmin, cambiarRol);

/**
 * @swagger
 * /api/usuarios/{id}/estado:
 *   put:
 *     summary: Activar o desactivar un usuario (solo admin)
 *     tags: [Usuarios]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               activo: { type: boolean, example: false }
 *     responses:
 *       200: { description: "Estado actualizado" }
 *       403: { description: "No autorizado" }
 */
router.put("/:id/estado", protegerRuta, soloAdmin, cambiarEstado);

/**
 * @swagger
 * /api/usuarios/{id}/sucursal:
 *   put:
 *     summary: Cambiar la sucursal de un usuario (solo admin)
 *     tags: [Usuarios]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sucursal: { type: string, description: "ID de la nueva sucursal" }
 *     responses:
 *       200: { description: "Sucursal actualizada" }
 *       403: { description: "No autorizado" }
 */
router.put("/:id/sucursal", protegerRuta, soloAdmin, cambiarSucursal);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   put:
 *     summary: Editar nombre, email o contraseña de un usuario (solo admin)
 *     tags: [Usuarios]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre: { type: string }
 *               email: { type: string }
 *               password: { type: string, description: "Opcional, solo si se quiere cambiar" }
 *     responses:
 *       200: { description: "Usuario actualizado" }
 *       403: { description: "No autorizado" }
 *   delete:
 *     summary: Eliminar un usuario (solo admin)
 *     tags: [Usuarios]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: "Usuario eliminado" }
 *       403: { description: "No autorizado" }
 *       404: { description: "Usuario no encontrado" }
 */
router.put("/:id", protegerRuta, soloAdmin, editarUsuarioAdmin);
router.delete("/:id", protegerRuta, soloAdmin, eliminarUsuario);

module.exports = router;

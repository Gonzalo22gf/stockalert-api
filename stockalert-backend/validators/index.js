const { z } = require("zod");

// ─── USUARIOS ───────────────────────────────────────────────────────────────
const registroSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(80),
  email: z.string().email("Email invalido"),
  password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres"),
  modo: z.enum(["crear", "unir"]).optional(),
  nombreEmpresa: z.string().min(2).max(100).optional(),
  numeroSucursal: z.union([z.string(), z.number()]).optional()
});

const loginSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(1, "La contrasena es obligatoria")
});

const cambiarRolSchema = z.object({
  rol: z.enum(["admin", "jefe"], { errorMap: () => ({ message: "Rol invalido. Debe ser admin o jefe" }) })
});

const cambiarEstadoSchema = z.object({
  activo: z.boolean({ errorMap: () => ({ message: "El campo activo debe ser true o false" }) })
});

const cambiarSucursalSchema = z.object({
  numeroSucursal: z.union([z.string(), z.number()]).transform(Number)
});

const editarUsuarioSchema = z.object({
  nombre: z.string().min(2).max(80).optional(),
  email: z.string().email("Email invalido").optional(),
  password: z.string().min(8).optional()
}).refine((d) => Object.keys(d).length > 0, { message: "No se enviaron campos para actualizar" });

// ─── PRODUCTOS ───────────────────────────────────────────────────────────────
const productoSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio").max(100),
  categoria: z.string().min(1, "La categoria es obligatoria"),
  precio: z.union([z.string(), z.number()]).transform(Number).refine((n) => n >= 0, "El precio no puede ser negativo"),
  codigoBarras: z.string().optional(),
  lote: z.string().optional(),
  sucursal: z.string().optional(),
  stock: z.union([z.string(), z.number()]).transform(Number).optional(),
  vencimiento: z.string().optional(),
  lotes: z.array(z.object({
    numero: z.string().optional(),
    stock: z.union([z.string(), z.number()]).transform(Number),
    vencimiento: z.string()
  })).optional()
});

// ─── SUCURSALES ───────────────────────────────────────────────────────────────
const sucursalSchema = z.object({
  zona: z.union([z.string(), z.number()]).transform(Number).refine((n) => n > 0, "La zona debe ser un numero positivo"),
  numero: z.union([z.string(), z.number()]).transform(Number).refine((n) => n > 0, "El numero debe ser un numero positivo"),
  direccion: z.string().max(200).optional()
});

// ─── LINKS ───────────────────────────────────────────────────────────────────
const linkSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio").max(50),
  url: z.string().url("La URL no es valida")
});

// ─── RECUPERACION ────────────────────────────────────────────────────────────
const olvidePasswordSchema = z.object({
  email: z.string().email("Email invalido")
});

const restablecerPasswordSchema = z.object({
  token: z.string().min(1, "El token es obligatorio"),
  password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres")
});

const pushTokenSchema = z.object({
  token: z.string().min(10, "Token invalido"),
  dispositivo: z.string().optional().default("web")
});

module.exports = {
  pushTokenSchema,
  registroSchema, loginSchema, cambiarRolSchema, cambiarEstadoSchema,
  cambiarSucursalSchema, editarUsuarioSchema, productoSchema, sucursalSchema,
  linkSchema, olvidePasswordSchema, restablecerPasswordSchema
};

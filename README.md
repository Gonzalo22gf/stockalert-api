# 📦 StockAlert

**Plataforma SaaS de inventario y control de vencimientos para negocios con múltiples sucursales.**

StockAlert permite a cualquier negocio gestionar el stock y las fechas de vencimiento de sus productos en múltiples sucursales, con alertas automáticas, dashboard analítico y reportes históricos. Cada empresa tiene su espacio completamente aislado — los datos de un negocio jamás son visibles para otro.

🌐 **Landing:** https://mistockalert.com
🚀 **App:** https://app.mistockalert.com
📚 **API Docs (Swagger):** https://api.mistockalert.com/api-docs

---

## ✨ Características

- **Multi-empresa (SaaS)** — cada negocio crea su cuenta y opera en su propio espacio aislado. Registro en dos modos: crear empresa nueva o unirse a una existente por código de acceso.
- **Gestión multi-sucursal** — inventario independiente por tienda, con roles diferenciados: el administrador ve todas las sucursales, el jefe de sucursal ve solo la suya.
- **Dashboard por rol** — el administrador ve métricas globales con filtro por sucursal; el jefe ve automáticamente los KPIs de su propia tienda.
- **Control de vencimientos** — clasificación automática: en buen estado, por vencer (≤7 días) y vencidos.
- **Exportación a Excel** — inventario, acciones urgentes y top 10 en riesgo con EAN, anchos automáticos, fila de totales y valor en riesgo. Reportes históricos multi-hoja.
- **Escáner de códigos de barras (EAN)** — carga rápida de productos desde la cámara del celular. EAN visible en dashboard y Excel.
- **Importación masiva** — carga de productos desde CSV/Excel.
- **Alertas diarias por correo** — el administrador recibe el top 10 de tiendas en riesgo; cada jefe recibe el parte de su tienda.
- **Reportes históricos** — captura automática diaria del estado de las tiendas, con visualización por período (diario, semanal, mensual, anual).
- **Internacionalización (i18n)** — interfaz disponible en 6 idiomas: Español, English, Português, 中文简体, 中文繁體, 日本語. Detección automática del idioma del navegador con selector manual.
- **Código de acceso por empresa** — cada empresa recibe un código único para invitar a su equipo, con botón de compartir nativo (Web Share API).
- **Links frecuentes** — cada empresa guarda hasta 30 accesos rápidos. Los administradores los gestionan; los jefes los consultan.
- **Sistema de planes con feature flag** — lógica de Free/Starter/Pro/Business implementada y lista para activar. Incluye validación de límites por plan, trial de 15 días y modal de upgrade automático.
- **Cierre automático por inactividad** — la sesión se cierra tras 10 minutos sin actividad.
- **Seguridad** — JWT con empresa embebida, Zod en todos los endpoints, control de acceso por rol, rate limiting, Helmet, sanitización NoSQL, CORS restringido, bloqueo por intentos fallidos e invalidación de sesiones al cambiar contraseña.
- **PWA instalable** — se instala desde el navegador en cualquier celular o computadora, con ícono propio y pantalla completa.
- **Diseño responsive** — escritorio y móvil.

---

## 🏗️ Arquitectura profesional

### Backend — arquitectura de capas

```
stockalert-backend/
├── controllers/     → orquestan: reciben request, llaman al service, devuelven response
├── services/        → lógica de negocio pura (sin HTTP ni Mongoose)
├── repositories/    → queries MongoDB centralizadas
├── validators/      → schemas Zod por endpoint (validación antes de tocar la DB)
├── middleware/      → auth, errorHandler centralizado, validar, validarPlan
├── config/          → planes.js con límites por plan (Free/Starter/Pro/Business)
├── utils/errors/    → AppError, NotFoundError, ForbiddenError, ValidationError
├── models/          → esquemas Mongoose
└── routes/          → definición de rutas
```

### Frontend — organizado por features

```
stockalert-frontend/src/
├── features/
│   ├── auth/        → login, registro, código de acceso, authStore
│   ├── dashboard/   → KPIs, panel de riesgo, gráficos, snapshots
│   ├── productos/   → tabla, cards, formularios, escáner EAN
│   ├── movimientos/
│   ├── sucursales/
│   ├── usuarios/
│   ├── reportes/
│   └── empresa/     → links frecuentes, widget empresa
├── components/      → Layout, Sidebar, Topbar, ErrorBoundary, ModalUpgrade, QueryState, ui/
├── hooks/           → useInactividad, useCountUp, usePlanError
└── lib/             → client HTTP, PlanError, exportar Excel, i18n/
```

---

## 🛠️ Stack tecnológico

**Frontend:** React + Vite, Tailwind CSS, React Query, Zustand, Chart.js, html5-qrcode, SheetJS/xlsx, lucide-react, react-i18next, vite-plugin-pwa.

**Backend:** Node.js + Express, MongoDB + Mongoose, Zod, JWT, bcrypt, Helmet, express-rate-limit, express-mongo-sanitize, Swagger, Pino.

**Infraestructura:** dominio propio `mistockalert.com` y `app.mistockalert.com` (GitHub Pages + Render), MongoDB Atlas, GitHub Actions (CI/CD + snapshots diarios + alertas), Brevo (correo transaccional), Docker.

**Calidad:** 35 tests (Jest + Supertest + mongodb-memory-server): seguridad de API, lógica de negocio y aislamiento IDOR entre empresas. Dependabot activo para vigilancia de vulnerabilidades.

---

## 💳 Sistema de planes

| Plan | Precio | Productos | Sucursales | Usuarios |
|------|--------|-----------|------------|----------|
| Free (trial 15 días) | $0 | 30 | 1 | 3 |
| Starter | $9/mes | 50 | 1 | 5 |
| Pro | $29/mes | Ilimitados | 10 | 20 |
| Business | $79/mes | Ilimitados | Ilimitadas | Ilimitados |

La validación de planes está implementada y se activa con `PLANES_HABILITADOS=true` en el entorno. Sin esa variable, todos los usuarios tienen acceso completo (modo desarrollo).

---

## 🔒 Seguridad multi-empresa

El aislamiento entre empresas está verificado con tests automáticos IDOR: una empresa no puede ver, editar ni eliminar datos de otra empresa por ningún camino, aunque conozca los IDs. Los tests corren en cada push.

Medidas adicionales: validación con Zod en todos los endpoints, bloqueo temporal (15 min) tras 5 intentos fallidos de login, invalidación de sesiones al cambiar contraseña, límite de payload de 1MB, Dependabot semanal.

---

## 🚀 Instalación local

**Requisitos:** Node.js 18+ y MongoDB (local o Atlas).

```bash
# Backend
cd stockalert-backend
npm install
npm run dev

# Frontend
cd stockalert-frontend
npm install
npm run dev
```

El frontend corre en http://localhost:5173/

---

## 🐳 Docker

```bash
docker compose up --build
```

Levanta backend en http://localhost:3000 y MongoDB local. Para detener: `docker compose down`.

---

## 🔑 Variables de entorno

Crear `.env` en `stockalert-backend/`:

```env
MONGO_URI=tu_cadena_de_conexion_mongodb
JWT_SECRET=una_clave_secreta_larga_y_aleatoria
CRON_SECRET=otra_clave_secreta_para_los_snapshots
BREVO_API_KEY=tu_api_key_de_brevo
EMAIL_USER=tu_remitente_verificado_en_brevo
PLANES_HABILITADOS=false
PORT=3000
```

---

## 🧭 Endpoints principales

Requieren `Authorization: Bearer <token>` (salvo login/registro).

- `POST /api/usuarios/registro` — crear empresa o unirse por código de acceso
- `POST /api/usuarios/login` — iniciar sesión
- `GET /api/productos` — listar productos (filtrado automático por empresa)
- `POST /api/productos` — crear producto (valida límite de plan si habilitado)
- `GET /api/sucursales/resumen` — métricas por tienda (admin: todas; jefe: la suya)
- `GET /api/empresa/perfil` — nombre y código de acceso de la empresa
- `GET/POST/PUT/DELETE /api/links` — gestión de links frecuentes
- `POST /api/snapshots/generar` — genera la foto del día (cron)
- `GET /api/snapshots/historico` — histórico por rango de fechas

---

## 🧪 Tests

```bash
cd stockalert-backend
npm test
```

35 tests en 4 suites: seguridad de la API, lógica de negocio, validación de contraseñas y aislamiento IDOR entre empresas.

---

## 📄 Licencia

Proyecto Full Stack desarrollado como demostración de una plataforma SaaS para gestión de inventario, vencimientos y múltiples sucursales.

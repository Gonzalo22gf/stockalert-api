# 📦 StockAlert

**Plataforma SaaS de inventario y control de vencimientos para negocios con múltiples sucursales.**

StockAlert permite a cualquier negocio gestionar el stock y las fechas de vencimiento de sus productos en múltiples sucursales, con alertas automáticas, dashboard analítico, reportes históricos y notificaciones push. Cada empresa tiene su espacio completamente aislado — los datos de un negocio jamás son visibles para otro.

🌐 **Landing:** https://mistockalert.com
🚀 **App:** https://app.mistockalert.com
📚 **API Docs (Swagger):** https://api.mistockalert.com/api-docs

---

## ✨ Características

- **Multi-empresa (SaaS)** — cada negocio crea su cuenta y opera en su propio espacio aislado. Registro en dos modos: crear empresa nueva o unirse a una existente por código de acceso.
- **Verificación de email** — al registrarse el usuario recibe un link de activación. No puede ingresar hasta verificar su cuenta.
- **Gestión multi-sucursal** — inventario independiente por tienda, con roles diferenciados: el administrador ve todas las sucursales, el jefe de sucursal ve solo la suya.
- **Dashboard por rol** — el administrador ve métricas globales con filtro por sucursal; el jefe ve automáticamente los KPIs de su propia tienda.
- **Control de vencimientos** — clasificación automática: en buen estado, por vencer (≤7 días) y vencidos.
- **Exportación a Excel** — inventario, acciones urgentes y top 10 en riesgo con EAN, anchos automáticos, fila de totales y valor en riesgo. Reportes históricos multi-hoja.
- **Escáner de códigos de barras (EAN)** — carga rápida de productos desde la cámara del celular.
- **Importación masiva** — carga de productos desde CSV/Excel.
- **Alertas diarias por correo + push** — el administrador recibe el top 10 de tiendas en riesgo; cada jefe recibe el parte de su tienda. Ambos también reciben notificaciones push en el celular.
- **Notificaciones push (PWA)** — botón de activación en el sidebar. Funciona en Android, iPhone (iOS 16.4+) y desktop via Firebase Cloud Messaging.
- **Reportes históricos** — captura automática diaria del estado de las tiendas, con visualización por período.
- **Internacionalización (i18n)** — interfaz disponible en 6 idiomas: Español, English, Português, 中文简体, 中文繁體, 日本語.
- **Panel superadmin** — panel exclusivo para el fundador: métricas globales, lista de empresas, acciones de activar/desactivar y eliminar con doble confirmación.
- **Sistema de planes con feature flag** — lógica de Free/Starter/Pro/Business implementada y lista para activar con una variable de entorno. Incluye validación de límites, trial de 15 días y modal de upgrade automático.
- **Cierre automático por inactividad** — la sesión se cierra tras 10 minutos sin actividad, incluso cuando la app está en background.
- **Seguridad** — JWT con passwordVersion, verificación de email, sanitización de inputs, Zod en todos los endpoints, rate limiting, Helmet, sanitización NoSQL, CORS restringido, bloqueo por intentos fallidos, contraseñas con mayúscula + número + carácter especial obligatorios.
- **PWA instalable** — se instala desde el navegador en cualquier celular o computadora.
- **Monitoreo** — Uptime Robot (2 monitores), Sentry (rastreo de errores), PostHog (analítica de usuarios), Cloudflare (DNS + DDoS + SSL).

---

## 🏗️ Arquitectura profesional

### Backend — arquitectura de capas

```
stockalert-backend/
├── controllers/     → reciben request, llaman al service, devuelven response (~20 líneas c/u)
├── services/        → lógica de negocio pura (sin HTTP ni Mongoose)
│   ├── email-templates.js  → responsabilidad única: genera HTML de emails
│   ├── snapshot.service.js → cálculo de snapshots diarios
│   ├── push.service.js     → notificaciones push via Firebase FCM
│   └── superadmin.service.js
├── repositories/    → queries MongoDB centralizadas
├── validators/      → schemas Zod por endpoint
├── middleware/      → auth, errorHandler, validar, validarPlan, protegerCron, soloFundador
├── config/          → planes.js (límites por plan), firebase.js (FCM admin)
├── utils/errors/    → AppError, NotFoundError, ForbiddenError, ValidationError
├── models/          → esquemas Mongoose
└── routes/          → definición de rutas
```

### Frontend — organizado por features

```
stockalert-frontend/src/
├── features/
│   ├── auth/        → login, registro, verificación email, authStore
│   ├── dashboard/   → KPIs, panel de riesgo, gráficos, snapshots
│   ├── productos/   → dividido en 5 archivos con responsabilidad única:
│   │   ├── productos.utils.js         → funciones puras (estadoVencimiento, filtrar, ordenar)
│   │   ├── useFiltradorProductos.js   → estado de filtros encapsulado
│   │   ├── useImportarProductos.js    → lógica de importación Excel
│   │   ├── FiltrosProductos.jsx       → solo JSX barra de filtros
│   │   └── ProductosPage.jsx          → ~90 líneas, solo coordina
│   ├── movimientos/
│   ├── sucursales/
│   ├── usuarios/
│   ├── reportes/
│   ├── empresa/     → links frecuentes, widget empresa
│   └── superadmin/  → SuperadminPage, useSuperadmin, superadmin.api
├── components/      → Layout, Sidebar, Topbar, ErrorBoundary, ModalUpgrade, QueryState
├── hooks/           → useInactividad (con visibilitychange), useCountUp, usePlanError, usePush
└── lib/             → client HTTP, PlanError, exportar Excel, firebase.js, i18n/
```

---

## 🛠️ Stack tecnológico

**Frontend:** React + Vite, Tailwind CSS, React Query, Zustand, Chart.js, html5-qrcode, SheetJS/xlsx, lucide-react, react-i18next, vite-plugin-pwa, firebase, posthog-js, @sentry/react.

**Backend:** Node.js + Express, MongoDB + Mongoose, Zod, JWT, bcrypt, Helmet, express-rate-limit, express-mongo-sanitize, Swagger, Pino, firebase-admin.

**Infraestructura:** dominio propio mistockalert.com y app.mistockalert.com (GitHub Pages + Render), MongoDB Atlas, GitHub Actions (CI/CD + snapshots diarios + alertas), Brevo (correo transaccional), Cloudflare (DNS + DDoS + SSL), Uptime Robot, Sentry, PostHog, Docker.

**Calidad:** 35 tests (Jest + Supertest + mongodb-memory-server): seguridad de API, lógica de negocio y aislamiento IDOR entre empresas.

---

## 💳 Sistema de planes

| Plan | Precio | Productos | Sucursales | Usuarios |
|------|--------|-----------|------------|----------|
| Free (trial 15 días) | $0 | 30 | 1 | 3 |
| Starter | $9/mes | 50 | 1 | 5 |
| Pro | $29/mes | Ilimitados | 10 | 20 |
| Business | $79/mes | Ilimitados | Ilimitadas | Ilimitados |

La validación de planes está implementada y se activa con `PLANES_HABILITADOS=true` en el entorno. Sin esa variable, todos los usuarios tienen acceso completo.

---

## 🔒 Seguridad

- JWT con invalidación automática al cambiar contraseña (passwordVersion)
- Verificación de email obligatoria al registrarse
- Contraseñas: mínimo 8 caracteres, mayúscula, número y carácter especial
- Sanitización de inputs (nombre y email) antes de persistir
- Zod en todos los endpoints — validación estricta de tipos
- Rate limiting: 200 req/15min general, 10 intentos login, 5 recovery
- Bloqueo temporal 15 minutos tras 5 intentos fallidos de login
- Sanitización NoSQL con express-mongo-sanitize
- CORS restringido a dominios propios
- Helmet con headers de seguridad
- Aislamiento IDOR verificado con 8 tests automáticos: una empresa no puede ver datos de otra por ningún camino

---

## 🚀 Instalación local

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

Levanta backend en http://localhost:3000 y MongoDB local.

---

## 🔑 Variables de entorno

Crear `.env` en `stockalert-backend/`:

```env
MONGO_URI=tu_cadena_de_conexion_mongodb
JWT_SECRET=una_clave_secreta_larga_y_aleatoria
CRON_SECRET=otra_clave_secreta_para_los_snapshots
BREVO_API_KEY=tu_api_key_de_brevo
EMAIL_USER=tu_remitente_verificado_en_brevo
FIREBASE_PROJECT_ID=stockalert-fd4d0
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@stockalert-fd4d0.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
FIREBASE_VAPID_KEY=tu_vapid_key
FUNDADORES_EMAILS=tu@email.com
APP_URL=https://app.mistockalert.com
PLANES_HABILITADOS=false
PORT=3000
```

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

# 📦 StockAlert

**Plataforma SaaS de inventario y control de vencimientos para negocios con múltiples sucursales.**

StockAlert permite a cualquier negocio gestionar el stock y las fechas de vencimiento de sus productos en múltiples sucursales, con alertas automáticas, dashboard analítico, reportes históricos y notificaciones push. Cada empresa tiene su espacio completamente aislado.

🌐 **Landing:** https://mistockalert.com
🚀 **App:** https://app.mistockalert.com
📚 **API Docs (Swagger):** https://api.mistockalert.com/api-docs

---

## ✨ Características

- **Multi-empresa (SaaS)** — registro autoservicio. Crear empresa nueva o unirse con código de acceso.
- **Verificación de email** — al registrarse llega un link de activación. Sin verificar, no se puede ingresar.
- **Gestión multi-sucursal** — inventario independiente por tienda. Admin ve todo, jefe ve solo su sucursal.
- **Dashboard por rol** — métricas globales para admin, KPIs propios para jefe.
- **Control de vencimientos** — clasificación automática: buen estado, por vencer (≤7 días), vencidos.
- **Exportación a Excel** — inventario, acciones urgentes, top 10 en riesgo con EAN y valor en riesgo.
- **Escáner EAN con autocompletado** — escanea el código de barras y autocompleta nombre y categoría via Open Food Facts + UPC Item DB.
- **Importación masiva** — carga de productos desde CSV/Excel.
- **Alertas diarias por correo + push** — admin recibe top 10 tiendas en riesgo; jefe recibe el parte de su tienda. Ambos reciben notificaciones push en el celular.
- **Notificaciones push (PWA)** — Firebase Cloud Messaging. Botón de activación en el sidebar.
- **Reportes históricos** — captura automática diaria con visualización por período.
- **i18n** — 6 idiomas: Español, English, Português, 中文简体, 中文繁體, 日本語.
- **Panel superadmin** — métricas globales, lista de empresas, activar/desactivar/eliminar con doble confirmación. Acceso exclusivo por email de fundador.
- **Sistema de planes** — Free/Starter($9)/Pro($29)/Business($79). Integración con Lemon Squeezy lista para activar. Modal de upgrade automático al llegar al límite.
- **Cierre automático por inactividad** — 10 minutos sin actividad, incluso desde background (visibilitychange).
- **Seguridad en capas** — JWT con passwordVersion, verificación de email, sanitización de inputs, Zod en todos los endpoints, HPP, CSP estricto, rate limiting, Helmet, sanitización NoSQL, CORS restringido, bloqueo por intentos fallidos, contraseñas con mayúscula + número + carácter especial.
- **Recuperación de contraseña** — token de un solo uso con expiración de 24hs, rate limit de 5 requests por IP cada 15 minutos.
- **PWA instalable** — Android, iPhone (iOS 16.4+) y desktop.
- **Monitoreo** — Uptime Robot, Sentry, PostHog, Cloudflare.

---

## 🏗️ Arquitectura profesional

### Backend — arquitectura de capas

```
stockalert-backend/
├── controllers/          → orquestan: reciben request, llaman al service, devuelven response
├── services/
│   ├── email-templates.js    → responsabilidad única: genera HTML de emails
│   ├── snapshot.service.js   → cálculo de snapshots diarios
│   ├── push.service.js       → notificaciones push via Firebase FCM
│   ├── lemon.service.js      → checkout y webhook de Lemon Squeezy
│   └── superadmin.service.js → métricas globales del panel fundador
├── repositories/         → queries MongoDB centralizadas
├── validators/           → schemas Zod por endpoint
├── middleware/
│   ├── auth.js           → JWT + soloAdmin
│   ├── soloFundador.js   → protege panel superadmin por email
│   ├── protegerCron.js   → protege endpoints de GitHub Actions
│   ├── validarPlan.js    → feature flag PLANES_HABILITADOS
│   └── errorHandler.js   → manejo centralizado de errores
├── config/
│   ├── planes.js         → límites por plan (Free/Starter/Pro/Business)
│   ├── firebase.js       → Firebase Admin SDK con guard para tests
│   └── lemon.js          → Lemon Squeezy config y variant IDs
├── utils/errors/         → AppError, NotFoundError, ForbiddenError, ValidationError
├── models/               → esquemas Mongoose
└── routes/               → definición de rutas
```

### Frontend — organizado por features

```
stockalert-frontend/src/
├── features/
│   ├── auth/         → login, registro, verificación email, authStore
│   ├── dashboard/    → KPIs, panel de riesgo, gráficos, snapshots
│   ├── productos/    → 5 archivos con responsabilidad única:
│   │   ├── productos.utils.js        → funciones puras
│   │   ├── useFiltradorProductos.js  → estado de filtros
│   │   ├── useImportarProductos.js   → lógica de importación
│   │   ├── useOpenFoodFacts.js       → autocompletado EAN (Open Food Facts + UPC Item DB)
│   │   ├── FiltrosProductos.jsx      → solo JSX barra de filtros
│   │   └── ProductosPage.jsx         → ~90 líneas, solo coordina
│   ├── movimientos/
│   ├── sucursales/
│   ├── usuarios/
│   ├── reportes/
│   ├── empresa/      → links frecuentes, widget empresa
│   ├── planes/       → PlanesPage, usePlanes, planes.api
│   └── superadmin/   → SuperadminPage, useSuperadmin, superadmin.api
├── components/       → Layout, Sidebar, Topbar, ErrorBoundary, ModalUpgrade
├── hooks/            → useInactividad, useCountUp, usePlanError, usePush
└── lib/              → client HTTP, PlanError, exportar Excel, firebase.js, i18n/
```

---

## 🛠️ Stack tecnológico

**Frontend:** React + Vite, Tailwind CSS, React Query, Zustand, Chart.js, html5-qrcode, SheetJS/xlsx, lucide-react, react-i18next, vite-plugin-pwa, firebase, posthog-js, @sentry/react.

**Backend:** Node.js + Express, MongoDB + Mongoose, Zod, JWT, bcrypt, Helmet, hpp, express-rate-limit, express-mongo-sanitize, Swagger, Pino, firebase-admin, @lemonsqueezy/lemonsqueezy.js.

**Infraestructura:** GitHub Pages + Render, MongoDB Atlas, GitHub Actions (CI/CD + snapshots + alertas), Brevo, Cloudflare, Uptime Robot, Sentry, PostHog, Docker.

**APIs externas gratuitas:** Open Food Facts + UPC Item DB (autocompletado de productos por EAN).

---

## 💳 Sistema de planes

| Plan | Precio | Productos | Sucursales | Usuarios |
|------|--------|-----------|------------|----------|
| Free (trial 15 días) | $0 | 30 | 1 | 3 |
| Starter | $9/mes | 50 | 1 | 5 |
| Pro | $29/mes | Ilimitados | 10 | 20 |
| Business | $79/mes | Ilimitados | Ilimitadas | Ilimitados |

Pagos via **Lemon Squeezy** (acepta tarjetas de cualquier país). Integración completa lista para activar con `LEMON_HABILITADO=true` + `PLANES_HABILITADOS=true` en Render.

---

## 🔒 Seguridad

- JWT con invalidación automática al cambiar contraseña (passwordVersion)
- Verificación de email obligatoria al registrarse
- Contraseñas: mínimo 8 caracteres, mayúscula, número y carácter especial obligatorios
- Sanitización de inputs antes de persistir
- Zod en todos los endpoints
- HPP — protección contra HTTP Parameter Pollution
- CSP estricto via Helmet
- Rate limiting: 200 req/15min general, 10 intentos login, 5 recovery
- Bloqueo temporal 15 minutos tras 5 intentos fallidos
- Sanitización NoSQL con express-mongo-sanitize
- CORS restringido a dominios propios
- Recuperación de contraseña: token de un solo uso, expira en 24hs, rate limit 5/15min

---

## 🧪 Tests

```bash
cd stockalert-backend
npm test
```

**117 tests en 10 suites** — cobertura completa:

| Suite | Tests | Cubre |
|-------|-------|-------|
| api.test.js | 8 | Health check, rutas protegidas, cron |
| aislamiento.test.js | 8 | IDOR entre empresas |
| auth.test.js | 13 | Registro, login, verificación email |
| clasificar.test.js | 9 | Lógica de alertas |
| integracion.test.js | 17 | Snapshots, push, superadmin, lemon, recuperación |
| recursos.test.js | 21 | Links, sucursales, productos, movimientos |
| seguridad.test.js | 7 | Bloqueo, recuperación, cron |
| usuarios-admin.test.js | 11 | Roles, desactivar, eliminar |
| validacion.test.js | 14 | Inputs Zod en todos los endpoints |
| validarPassword.test.js | 8 | Reglas de contraseña |

---

## 🚀 Instalación local

```bash
cd stockalert-backend && npm install && npm run dev
cd stockalert-frontend && npm install && npm run dev
```

---

## 🐳 Docker

```bash
docker compose up --build
```

---

## 🔑 Variables de entorno

```env
MONGO_URI=
JWT_SECRET=
CRON_SECRET=
BREVO_API_KEY=
EMAIL_USER=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FIREBASE_VAPID_KEY=
FUNDADORES_EMAILS=
APP_URL=https://app.mistockalert.com
LEMON_API_KEY=
LEMON_STORE_ID=449050
LEMON_VARIANT_STARTER=2001100
LEMON_VARIANT_PRO=2001102
LEMON_VARIANT_BUSINESS=2001104
LEMON_WEBHOOK_SECRET=
LEMON_HABILITADO=false
PLANES_HABILITADOS=false
PORT=3000
```

---

## 📄 Licencia

Proyecto Full Stack — plataforma SaaS de inventario para negocios con múltiples sucursales.

# 📦 StockAlert

**SaaS multi-empresa de inventario y control de vencimientos para supermercados.**

StockAlert permite a cualquier negocio gestionar el stock y las fechas de vencimiento de sus productos en múltiples sucursales, con alertas automáticas, dashboard analítico y reportes históricos. Cada empresa tiene su espacio completamente aislado — los datos de un negocio jamás son visibles para otro.

🔗 **Demo en vivo:** https://mistockalert.com
📚 **API Docs (Swagger):** https://api.mistockalert.com/api-docs

---

## ✨ Características

- **Multi-empresa (SaaS)** — cada negocio crea su cuenta y opera en su propio espacio aislado. Registro en dos modos: crear empresa nueva o unirse a una existente.
- **Gestión multi-sucursal** — inventario independiente por tienda, con roles diferenciados (administrador ve todo; jefe de sucursal ve solo su tienda).
- **Control de vencimientos** — clasificación automática: en buen estado, por vencer (≤7 días) y vencidos.
- **Dashboard analítico** — KPIs en tiempo real, acciones urgentes, top de productos en riesgo y gráficos por categoría, tienda y estado.
- **Reportes históricos** — captura automática diaria del estado de las tiendas, con visualización por período (diario, semanal, mensual, anual).
- **Exportación a Excel** — reportes multi-hoja (resumen general + una hoja por tienda), con desglose por categoría.
- **Escáner de códigos de barras (EAN)** — carga rápida de productos desde la cámara del celular. Búsqueda por nombre, lote, EAN o sucursal.
- **Importación / exportación** — carga masiva de productos desde CSV/Excel.
- **Alertas diarias por correo** — el administrador recibe el top 10 de tiendas en riesgo de su empresa; cada jefe recibe el parte de su tienda.
- **Seguridad** — JWT con empresa embebida, control de acceso por rol, rate limiting, Helmet, sanitización NoSQL, CORS restringido, bloqueo por intentos fallidos e invalidación de sesiones al cambiar contraseña.
- **PWA instalable** — se instala desde el navegador en cualquier celular o computadora, con ícono propio y pantalla completa. Se actualiza automáticamente con cada deploy.
- **Diseño responsive** — escritorio y móvil, con íconos lucide-react y animaciones suaves.

---

## 🛠️ Stack tecnológico

**Frontend:** React + Vite, Tailwind CSS, React Query, Zustand, Chart.js, html5-qrcode, SheetJS/xlsx, lucide-react, vite-plugin-pwa.

**Backend:** Node.js + Express, MongoDB + Mongoose, JWT, bcrypt, Helmet, express-rate-limit, express-mongo-sanitize, Swagger, Pino (logs estructurados).

**Infraestructura:** dominio propio `mistockalert.com` (GitHub Pages + Render), MongoDB Atlas, GitHub Actions (CI/CD + snapshots diarios + alertas), Brevo (correo transaccional), Docker.

**Calidad:** 35 tests (Jest + Supertest + mongodb-memory-server): seguridad de API, lógica de negocio y aislamiento IDOR entre empresas. Dependabot activo para vigilancia de vulnerabilidades.

---

## 🚀 Instalación local

**Requisitos:** Node.js 18+ y MongoDB (local o Atlas).

**Backend:**
```bash
cd stockalert-backend
npm install
npm run dev
```

**Frontend:**
```bash
cd stockalert-frontend
npm install
npm run dev
```

El frontend corre en http://localhost:5173/

---

## 🐳 Levantar con Docker

La forma más rápida — sin instalar Node ni MongoDB:

```bash
docker compose up --build
```

Levanta dos contenedores conectados: backend en http://localhost:3000 y MongoDB local. Para detener: Ctrl+C o `docker compose down`.

---

## 🔒 Seguridad multi-empresa

El aislamiento entre empresas está verificado con tests automáticos de aislamiento IDOR: una empresa no puede ver, editar ni eliminar datos de otra empresa por ningún camino, aunque conozca los IDs. Los tests corren en cada push.

Medidas adicionales: bloqueo temporal de cuenta (15 min) tras 5 intentos fallidos de login, invalidación de sesiones al cambiar contraseña, límite de payload de 1MB, Dependabot semanal.

---

## 🔑 Variables de entorno

Crear un `.env` en `stockalert-backend/`:

```env
MONGO_URI=tu_cadena_de_conexion_mongodb
JWT_SECRET=una_clave_secreta_larga_y_aleatoria
CRON_SECRET=otra_clave_secreta_para_los_snapshots
BREVO_API_KEY=tu_api_key_de_brevo
EMAIL_USER=tu_remitente_verificado_en_brevo
PORT=3000
```

El `.env` no se sube al repositorio (está en `.gitignore`).

---

## 🧭 Endpoints principales

Requieren token JWT en el header `Authorization: Bearer <token>` (salvo login/registro).

- `POST /api/usuarios/registro` — crear empresa nueva o unirse a una existente
- `POST /api/usuarios/login` — iniciar sesión
- `GET /api/productos` — listar productos (filtrado automático por empresa)
- `POST /api/productos` — crear producto
- `GET /api/sucursales/resumen` — métricas por tienda (admin)
- `POST /api/snapshots/generar` — genera la foto del día (protegido por clave, lo dispara el cron)
- `GET /api/snapshots/historico` — histórico por rango de fechas (admin)

---

## 🏗️ Arquitectura

- **stockalert-backend/** — API REST (Node + Express + MongoDB): config, controllers, middleware, models, routes, utils.
- **stockalert-frontend/** — SPA (React + Vite + PWA): api, hooks, components, pages, store.
- **.github/workflows/** — CI/CD: deploy automático + snapshot diario + alertas diarias.
- **.github/dependabot.yml** — actualización automática de dependencias.

Cada empresa tiene sus propios datos, usuarios, sucursales y snapshots. El sistema captura una foto del estado del inventario de cada empresa cada día (vía GitHub Actions), lo que permite construir reportes históricos con la evolución real en el tiempo.

---

## 🧪 Tests

```bash
cd stockalert-backend
npm test
```

35 tests en 4 suites: seguridad de la API (rutas protegidas, tokens), lógica de negocio (clasificación de alertas, validación de contraseñas) y aislamiento IDOR entre empresas.

---

## 📄 Licencia

Proyecto de portfolio. Uso educativo y demostrativo.

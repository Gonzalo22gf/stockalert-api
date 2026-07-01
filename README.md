# 📦 StockAlert

**Sistema de inventario y control de vencimientos multi-sucursal para supermercados.**

StockAlert permite a cadenas de supermercados gestionar el stock y las fechas de vencimiento de sus productos en múltiples sucursales, con alertas de productos vencidos, próximos a vencer y con stock crítico. Incluye un dashboard analítico, reportes históricos con evolución en el tiempo y exportación a Excel.

🔗 **Demo en vivo:** https://gonzalo22gf.github.io/stockalert-api/

---

## ✨ Características

- **Gestión multi-sucursal** — inventario independiente por tienda, con roles (administrador y jefe de sucursal).
- **Control de vencimientos** — clasificación automática: en buen estado, por vencer (≤7 días) y vencidos.
- **Dashboard analítico** — KPIs en tiempo real, acciones urgentes, top de productos en riesgo y gráficos por categoría, tienda y estado.
- **Reportes históricos** — captura automática diaria del estado de las tiendas, con visualización por período (diario, semanal, mensual, anual).
- **Exportación a Excel** — reportes multi-hoja (resumen general + una hoja por tienda), con desglose por categoría.
- **Escáner de códigos de barras (EAN)** — carga rápida de productos desde la cámara del celular.
- **Importación / exportación** — carga masiva de productos desde CSV/Excel.
- **Seguridad** — JWT, control de acceso por rol, rate limiting, Helmet, sanitización NoSQL y CORS restringido.
- **Diseño responsive** — escritorio y móvil.

---

## 🛠️ Stack tecnológico

**Frontend:** React + Vite, Tailwind CSS, React Query, Zustand, Chart.js, html5-qrcode, SheetJS/xlsx.

**Backend:** Node.js + Express, MongoDB + Mongoose, JWT, bcrypt, Helmet, express-rate-limit, express-mongo-sanitize.

**Infraestructura:** Frontend en GitHub Pages (deploy automático con GitHub Actions), backend en Render, base de datos en MongoDB Atlas, snapshots diarios vía GitHub Actions (cron).

---

## 🚀 Instalación local

**Requisitos:** Node.js 18+ y una base de datos MongoDB (local o Atlas).

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

El frontend corre en http://localhost:5173/stockalert-api/

---

## 🔑 Variables de entorno

Crear un `.env` en `stockalert-backend/`:

```env
MONGO_URI=tu_cadena_de_conexion_mongodb
JWT_SECRET=una_clave_secreta_larga_y_aleatoria
CRON_SECRET=otra_clave_secreta_para_los_snapshots
PORT=3000
```

El `.env` no se sube al repositorio (está en `.gitignore`).

---

## 🧭 Endpoints principales

Requieren token JWT en el header `Authorization: Bearer <token>` (salvo login/registro).

- `POST /api/usuarios/login` — iniciar sesión
- `GET /api/productos` — listar productos
- `POST /api/productos` — crear producto
- `GET /api/sucursales/resumen` — métricas por tienda (admin)
- `POST /api/snapshots/generar` — genera la foto del día (protegido por clave, lo dispara el cron)
- `GET /api/snapshots/historico` — histórico por rango de fechas (admin)

---

## 🏗️ Arquitectura

- **stockalert-backend/** — API REST (Node + Express + MongoDB): config, controllers, middleware, models, routes.
- **stockalert-frontend/** — SPA (React + Vite): api, hooks, components, pages, store.
- **.github/workflows/** — CI/CD: deploy automático + snapshot diario.

El sistema captura un snapshot del estado de todas las sucursales cada día (vía GitHub Actions), lo que permite construir reportes históricos con la evolución del inventario en el tiempo.

---

## 📄 Licencia

Proyecto de portfolio. Uso educativo y demostrativo.

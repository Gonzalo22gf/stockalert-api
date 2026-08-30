import UsuariosPage from "./features/usuarios/UsuariosPage";
import SucursalesPage from "./features/sucursales/SucursalesPage";
import CategoriasPage from "./features/categorias/CategoriasPage";
import MovimientosPage from "./features/movimientos/MovimientosPage";
import ProductosPage from "./features/productos/ProductosPage";
import DashboardPage from "./features/dashboard/DashboardPage";
import ReportesPage from "./features/reportes/ReportesPage";
import LinksPage from "./features/empresa/LinksPage";
import CodigoAccesoPage from "./features/auth/CodigoAccesoPage";
import { Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "./features/auth/authStore";
import SuperadminPage from "./features/superadmin/SuperadminPage";
import PlanesPage from "./features/planes/PlanesPage";
import LoginPage from "./features/auth/LoginPage";
import VerificarEmailPage from "./features/auth/VerificarEmailPage";
import RestablecerPage from "./features/auth/RestablecerPage";
import Layout from "./components/Layout";

const FUNDADORES = ["gef.22@hotmail.com"];

// Solo requiere estar logueado.
function RutaProtegida({ children }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

// Pantalla de "sin acceso" — cuando el rol no alcanza para ver la seccion.
function SinAcceso() {
  const { t } = useTranslation();
  return (
    <div className="flex h-full items-center justify-center px-6 py-16 text-center">
      <div>
        <p className="text-4xl">🔒</p>
        <p className="mt-3 text-base font-bold text-white">{t("acceso.titulo")}</p>
        <p className="mt-1 text-sm text-slate-500">{t("acceso.detalle")}</p>
      </div>
    </div>
  );
}

// Requiere rol admin; si no, muestra "sin acceso" (no redirige, para que el usuario entienda).
function RutaAdmin({ children }) {
  const usuario = useAuthStore((s) => s.usuario);
  if (usuario?.rol !== "admin") return <SinAcceso />;
  return children;
}

// Requiere ser fundador (por email). Para el panel superadmin.
function RutaFundador({ children }) {
  const usuario = useAuthStore((s) => s.usuario);
  if (!FUNDADORES.includes(usuario?.email?.toLowerCase())) return <SinAcceso />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/restablecer" element={<RestablecerPage />} />
      <Route path="/verificar-email" element={<VerificarEmailPage />} />
      <Route
        path="/"
        element={
          <RutaProtegida>
            <Layout />
          </RutaProtegida>
        }
      >
        {/* Todos los roles */}
        <Route index element={<DashboardPage />} />
        <Route path="productos" element={<ProductosPage />} />
        <Route path="movimientos" element={<MovimientosPage />} />
        <Route path="links" element={<LinksPage />} />

        {/* Solo admin */}
        <Route path="sucursales" element={<RutaAdmin><SucursalesPage /></RutaAdmin>} />
        <Route path="categorias" element={<RutaAdmin><CategoriasPage /></RutaAdmin>} />
        <Route path="usuarios" element={<RutaAdmin><UsuariosPage /></RutaAdmin>} />
        <Route path="reportes" element={<RutaAdmin><ReportesPage /></RutaAdmin>} />
        <Route path="codigo-acceso" element={<RutaAdmin><CodigoAccesoPage /></RutaAdmin>} />
        <Route path="planes" element={<RutaAdmin><PlanesPage /></RutaAdmin>} />

        {/* Solo fundador */}
        <Route path="superadmin" element={<RutaFundador><SuperadminPage /></RutaFundador>} />
      </Route>
    </Routes>
  );
}

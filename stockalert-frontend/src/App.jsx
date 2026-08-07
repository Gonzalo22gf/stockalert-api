import UsuariosPage from "./features/usuarios/UsuariosPage";
import SucursalesPage from "./features/sucursales/SucursalesPage";
import MovimientosPage from "./features/movimientos/MovimientosPage";
import ProductosPage from "./features/productos/ProductosPage";
import DashboardPage from "./features/dashboard/DashboardPage";
import ReportesPage from "./features/reportes/ReportesPage";
import LinksPage from "./features/empresa/LinksPage";
import CodigoAccesoPage from "./features/auth/CodigoAccesoPage";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./features/auth/authStore";
import SuperadminPage from "./features/superadmin/SuperadminPage";
import LoginPage from "./features/auth/LoginPage";
import RestablecerPage from "./features/auth/RestablecerPage";
import Layout from "./components/Layout";

function RutaProtegida({ children }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/restablecer" element={<RestablecerPage />} />
      <Route
        path="/"
        element={
          <RutaProtegida>
            <Layout />
          </RutaProtegida>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="productos" element={<ProductosPage />} />
        <Route path="movimientos" element={<MovimientosPage />} />
        <Route path="sucursales" element={<SucursalesPage />} />
        <Route path="usuarios" element={<UsuariosPage />} />
        <Route path="reportes" element={<ReportesPage />} />
        <Route path="links" element={<LinksPage />} />
        <Route path="codigo-acceso" element={<CodigoAccesoPage />} />
      </Route>
    </Routes>
  );
}

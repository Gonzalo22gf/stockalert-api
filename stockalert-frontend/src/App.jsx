import UsuariosPage from "./pages/UsuariosPage";
import SucursalesPage from "./pages/SucursalesPage";
import MovimientosPage from "./pages/MovimientosPage";
import ProductosPage from "./pages/ProductosPage";
import DashboardPage from "./pages/DashboardPage";
import ReportesPage from "./pages/ReportesPage";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import LoginPage from "./pages/LoginPage";
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
      </Route>
    </Routes>
  );
}

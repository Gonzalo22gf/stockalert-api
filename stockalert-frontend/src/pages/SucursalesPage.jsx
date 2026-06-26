import EmptyState from "../components/EmptyState";
import { SkeletonTabla } from "../components/Skeleton";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuthStore } from "../store/authStore";
import { useResumenSucursales, useEliminarSucursal } from "../hooks/useSucursales";
import { obtenerProductos } from "../api/productos";
import { descargarBackupSucursal } from "../utils/exportar";
import ModalSucursal from "../components/ModalSucursal";

export default function SucursalesPage() {
  const usuario = useAuthStore((s) => s.usuario);
  const esAdmin = usuario?.rol === "admin";
  const navigate = useNavigate();

  const { data: resumen, isLoading, isError } = useResumenSucursales(esAdmin);
  const eliminarSucursal = useEliminarSucursal();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [sucursalEditando, setSucursalEditando] = useState(null);
  const [filtroZona, setFiltroZona] = useState("");
  const [filtroNumero, setFiltroNumero] = useState("");

  if (!esAdmin) {
    return <Navigate to="/productos" replace />;
  }

  function abrirCrear() {
    setSucursalEditando(null);
    setModalAbierto(true);
  }

  function abrirEditar(sucursal) {
    setSucursalEditando(sucursal);
    setModalAbierto(true);
  }

  function cerrarModal() {
    setModalAbierto(false);
    setSucursalEditando(null);
  }

  function irAProductos(sucursalId) {
    navigate(`/productos?sucursal=${sucursalId}`);
  }

  async function manejarEliminar(item) {
    const sucursal = item.sucursal;
    const cantProductos = item.totalProductos;

    const resultado = await Swal.fire({
      title: "⚠️ Eliminar sucursal",
      html: `
        <div style="text-align:left;font-size:14px">
          Vas a eliminar <b>${sucursal.nombre}</b>.<br><br>
          Esto borrará también sus <b>${cantProductos} producto(s)</b>.<br><br>
          <span style="color:#f87171">Esta acción <b>no se puede deshacer</b>.</span><br><br>
          Antes de borrar se descargará automáticamente un <b>backup en Excel</b> con todos los datos.
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, descargar backup y eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626"
    });

    if (!resultado.isConfirmed) return;

    try {
      // 1. Traer los productos de la sucursal para el backup
      const productos = await obtenerProductos(sucursal._id);

      // 2. Descargar backup ANTES de borrar
      descargarBackupSucursal(sucursal, productos || []);

      // 3. Borrar
      const respuesta = await eliminarSucursal.mutateAsync(sucursal._id);

      Swal.fire({
        icon: "success",
        title: "Sucursal eliminada",
        text: `Se eliminó "${sucursal.nombre}" y ${respuesta.productosEliminados || 0} producto(s). El backup quedó descargado.`
      });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    }
  }

  const formatoMoneda = (v) => Number(v).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

  const zonas = [...new Set((resumen || []).map((r) => r.sucursal.zona))].sort((a, b) => a - b);

  const resumenFiltrado = (resumen || []).filter((r) => {
    const coincideZona = filtroZona ? String(r.sucursal.zona) === filtroZona : true;
    const coincideNumero = filtroNumero ? String(r.sucursal.numero).includes(filtroNumero) : true;
    return coincideZona && coincideNumero;
  });

  const inputClase =
    "rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand focus:outline-none";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <select value={filtroZona} onChange={(e) => setFiltroZona(e.target.value)} className={inputClase}>
            <option value="">Todas las zonas</option>
            {zonas.map((z) => (
              <option key={z} value={z}>
                Zona {z}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="🔍 Buscar por N° de tienda..."
            value={filtroNumero}
            onChange={(e) => setFiltroNumero(e.target.value)}
            className={inputClase}
          />
        </div>
        <button onClick={abrirCrear} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          + Nueva sucursal
        </button>
      </div>

      {isLoading && <SkeletonTabla filas={4} />}
      {isError && <p className="text-sm text-red-400">No se pudieron cargar las sucursales.</p>}

      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">N°</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Dirección</th>
                <th className="px-4 py-3 text-center">Productos</th>
                <th className="px-4 py-3 text-center">Vencidos</th>
                <th className="px-4 py-3 text-center">Stock crítico</th>
                <th className="px-4 py-3 text-right">Valor inventario</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {resumenFiltrado.map((r) => (
                <tr key={r.sucursal._id} className="bg-slate-950/50">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => irAProductos(r.sucursal._id)}
                      className="font-bold text-brand hover:underline"
                      title="Ver productos de esta sucursal"
                    >
                      {r.sucursal.numero}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-semibold text-white">{r.sucursal.nombre}</td>
                  <td className="px-4 py-3 text-slate-400">{r.sucursal.direccion || "Sin dirección"}</td>
                  <td className="px-4 py-3 text-center text-white">{r.totalProductos}</td>
                  <td className="px-4 py-3 text-center text-white">{r.vencidos}</td>
                  <td className={`px-4 py-3 text-center ${r.stockCritico > 0 ? "text-orange-400" : "text-white"}`}>{r.stockCritico}</td>
                  <td className="px-4 py-3 text-right text-white">{formatoMoneda(r.valorInventario)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => abrirEditar(r.sucursal)}
                        className="rounded-lg bg-brand/15 px-3 py-1 text-xs font-semibold text-brand hover:bg-brand/25"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => manejarEliminar(r)}
                        className="rounded-lg bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/25"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {resumenFiltrado.length === 0 && (
            <EmptyState icono="🏪" titulo="No hay sucursales" descripcion="Creá una nueva sucursal con el botón de arriba a la derecha." />
          )}
        </div>
      )}

      {modalAbierto && <ModalSucursal sucursal={sucursalEditando} onCerrar={cerrarModal} />}
    </div>
  );
}
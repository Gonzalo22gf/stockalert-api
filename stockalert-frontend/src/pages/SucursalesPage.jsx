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
import Boton from "../components/ui/Boton";
import { Input, Select } from "../components/ui/Input";

function MenuAcciones({ onEditar, onEliminar }) {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  function alternar(e) {
    if (!abierto) {
      const r = e.currentTarget.getBoundingClientRect();
      const anchoMenu = 160;
      const altoMenu = 90;
      let left = r.right - anchoMenu;
      let top = r.bottom + 6;
      if (top + altoMenu > window.innerHeight) top = r.top - altoMenu - 6;
      if (left < 8) left = 8;
      setPos({ top, left });
    }
    setAbierto((v) => !v);
  }
  const [abierto, setAbierto] = useState(false);
  const item = "block w-full px-4 py-2 text-left text-[13px] font-medium transition-colors hover:bg-[#1a1d26]";
  return (
    <div className="relative inline-block text-left">
      <button
        onClick={alternar}
        className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-slate-300 transition-colors hover:bg-slate-700"
        title="Acciones"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>
      {abierto && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setAbierto(false)} />
          <div className="fixed z-20 w-40 animate-pop overflow-hidden rounded-xl border border-[#2a2e3a] shadow-2xl shadow-black/60" style={{ top: pos.top, left: pos.left, backgroundColor: "#13151c" }}>
            <button onClick={() => { setAbierto(false); onEditar(); }} className={item} style={{ color: "#cbd1e0" }}>Editar</button>
            <button onClick={() => { setAbierto(false); onEliminar(); }} className={item} style={{ color: "#f87171" }}>Eliminar</button>
          </div>
        </>
      )}
    </div>
  );
}

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
    navigate("/productos?sucursal=" + sucursalId);
  }

  async function manejarEliminar(item) {
    const sucursal = item.sucursal;
    const cantProductos = item.totalProductos;

    const resultado = await Swal.fire({
      title: "⚠️ Eliminar sucursal",
      html:
        "<div style=\"text-align:left;font-size:14px\">Vas a eliminar <b>" + sucursal.nombre + "</b>.<br><br>" +
        "Esto borrará también sus <b>" + cantProductos + " producto(s)</b>.<br><br>" +
        "<span style=\"color:#f87171\">Esta acción <b>no se puede deshacer</b>.</span><br><br>" +
        "Antes de borrar se descargará automáticamente un <b>backup en Excel</b> con todos los datos.</div>",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, descargar backup y eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626"
    });

    if (!resultado.isConfirmed) return;

    try {
      const productos = await obtenerProductos(sucursal._id);
      descargarBackupSucursal(sucursal, productos || []);
      const respuesta = await eliminarSucursal.mutateAsync(sucursal._id);
      Swal.fire({
        icon: "success",
        title: "Sucursal eliminada",
        text: "Se eliminó \"" + sucursal.nombre + "\" y " + (respuesta.productosEliminados || 0) + " producto(s). El backup quedó descargado."
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={filtroZona} onChange={(e) => setFiltroZona(e.target.value)} className="w-auto">
            <option value="">Todas las zonas</option>
            {zonas.map((z) => (
              <option key={z} value={z}>Zona {z}</option>
            ))}
          </Select>
          <Input
            type="text"
            placeholder="🔍 Buscar por N° de tienda..."
            value={filtroNumero}
            onChange={(e) => setFiltroNumero(e.target.value)}
            className="w-auto"
          />
        </div>
        <Boton onClick={abrirCrear}>+ Nueva sucursal</Boton>
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
                <tr key={r.sucursal._id} className="bg-slate-950/50 transition-colors hover:bg-slate-900/50">
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
                  <td className={"px-4 py-3 text-center " + (r.stockCritico > 0 ? "text-orange-400" : "text-white")}>{r.stockCritico}</td>
                  <td className="px-4 py-3 text-right text-white">{formatoMoneda(r.valorInventario)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <MenuAcciones onEditar={() => abrirEditar(r.sucursal)} onEliminar={() => manejarEliminar(r)} />
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

import EmptyState from "../../components/EmptyState";
import { SkeletonTabla } from "../../components/Skeleton";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { useAuthStore } from "../auth/authStore";
import { useResumenSucursales, useEliminarSucursal } from "./useSucursales";
import { obtenerProductos } from "../productos/productos.api";
import { descargarBackupSucursal } from "../../lib/exportar";
import ModalSucursal from "./ModalSucursal";
import Boton from "../../components/ui/Boton";
import { Input, Select } from "../../components/ui/Input";

function MenuAcciones({ onEditar, onEliminar, t }) {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [abierto, setAbierto] = useState(false);
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
  const item = "block w-full px-4 py-2 text-left text-[13px] font-medium transition-colors hover:bg-[#1a1d26]";
  return (
    <div className="relative inline-block text-left">
      <button onClick={alternar} className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-slate-300 transition-colors hover:bg-slate-700" title="Acciones">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
        </svg>
      </button>
      {abierto && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setAbierto(false)} />
          <div className="fixed z-20 w-40 animate-pop overflow-hidden rounded-xl border border-[#2a2e3a] shadow-2xl shadow-black/60" style={{ top: pos.top, left: pos.left, backgroundColor: "#13151c" }}>
            <button onClick={() => { setAbierto(false); onEditar(); }} className={item} style={{ color: "#cbd1e0" }}>{t("sucursales.editar")}</button>
            <button onClick={() => { setAbierto(false); onEliminar(); }} className={item} style={{ color: "#f87171" }}>{t("sucursales.eliminar")}</button>
          </div>
        </>
      )}
    </div>
  );
}

export default function SucursalesPage() {
  const { t } = useTranslation();
  const usuario = useAuthStore((s) => s.usuario);
  const esAdmin = usuario?.rol === "admin";
  const navigate = useNavigate();
  const { data: resumen, isLoading, isError } = useResumenSucursales(esAdmin);
  const eliminarSucursal = useEliminarSucursal();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [sucursalEditando, setSucursalEditando] = useState(null);
  const [filtroZona, setFiltroZona] = useState("");
  const [filtroNumero, setFiltroNumero] = useState("");

  if (!esAdmin) return <Navigate to="/productos" replace />;

  function abrirCrear() { setSucursalEditando(null); setModalAbierto(true); }
  function abrirEditar(sucursal) { setSucursalEditando(sucursal); setModalAbierto(true); }
  function cerrarModal() { setModalAbierto(false); setSucursalEditando(null); }
  function irAProductos(sucursalId) { navigate("/productos?sucursal=" + sucursalId); }

  async function manejarEliminar(item) {
    const sucursal = item.sucursal;
    const resultado = await Swal.fire({
      title: t("sucursales.confirmEliminar"),
      html: "<div style='text-align:left;font-size:14px'>Vas a eliminar <b>" + sucursal.nombre + "</b>.<br><br>" +
        t("sucursales.advertencia") + "<br><br><span style='color:#f87171'>" + t("sucursales.noDeshacer") + "</span></div>",
      icon: "warning", showCancelButton: true,
      confirmButtonText: t("sucursales.eliminar"), cancelButtonText: t("sucursales.cancelar"), confirmButtonColor: "#dc2626"
    });
    if (!resultado.isConfirmed) return;
    try {
      const productos = await obtenerProductos(sucursal._id);
      descargarBackupSucursal(sucursal, productos || []);
      await eliminarSucursal.mutateAsync(sucursal._id);
      Swal.fire({ icon: "success", title: t("sucursales.eliminada") });
    } catch (error) {
      Swal.fire({ icon: "error", title: t("sucursales.error"), text: error.message });
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
            <option value="">{t("sucursales.todas")}</option>
            {zonas.map((z) => (<option key={z} value={z}>{t("sucursales.zona")} {z}</option>))}
          </Select>
          <Input type="text" placeholder={"🔍 " + t("sucursales.buscar")} value={filtroNumero} onChange={(e) => setFiltroNumero(e.target.value)} className="w-auto" />
        </div>
        <Boton onClick={abrirCrear}>+ {t("sucursales.agregar")}</Boton>
      </div>

      {isLoading && <SkeletonTabla filas={4} />}
      {isError && <p className="text-sm text-red-400">{t("sucursales.error")}</p>}
      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">{t("sucursales.numero")}</th>
                <th className="px-4 py-3">{t("sucursales.nombre")}</th>
                <th className="px-4 py-3">{t("sucursales.direccion")}</th>
                <th className="px-4 py-3 text-center">{t("sucursales.productos")}</th>
                <th className="px-4 py-3 text-center">{t("sucursales.vencidos")}</th>
                <th className="px-4 py-3 text-center">{t("sucursales.stockCritico")}</th>
                <th className="px-4 py-3 text-right">{t("sucursales.valorInventario")}</th>
                <th className="px-4 py-3 text-right">{t("common.acciones")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {resumenFiltrado.map((r) => (
                <tr key={r.sucursal._id} className="bg-slate-950/50 transition-colors hover:bg-slate-900/50">
                  <td className="px-4 py-3">
                    <button onClick={() => irAProductos(r.sucursal._id)} className="font-bold text-brand hover:underline">{r.sucursal.numero}</button>
                  </td>
                  <td className="px-4 py-3 font-semibold text-white">{r.sucursal.nombre}</td>
                  <td className="px-4 py-3 text-slate-400">{r.sucursal.direccion || t("sucursales.sinDireccion")}</td>
                  <td className="px-4 py-3 text-center text-white">{r.totalProductos}</td>
                  <td className="px-4 py-3 text-center text-white">{r.vencidos}</td>
                  <td className={"px-4 py-3 text-center " + (r.stockCritico > 0 ? "text-orange-400" : "text-white")}>{r.stockCritico}</td>
                  <td className="px-4 py-3 text-right text-white">{formatoMoneda(r.valorInventario)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <MenuAcciones t={t} onEditar={() => abrirEditar(r.sucursal)} onEliminar={() => manejarEliminar(r)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {resumenFiltrado.length === 0 && (
            <EmptyState icono="🏪" titulo={t("sucursales.sinSucursales")} descripcion="" />
          )}
        </div>
      )}
      {modalAbierto && <ModalSucursal sucursal={sucursalEditando} onCerrar={cerrarModal} />}
    </div>
  );
}

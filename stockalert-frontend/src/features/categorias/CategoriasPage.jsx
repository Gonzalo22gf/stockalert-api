import EmptyState from "../../components/EmptyState";
import { SkeletonTabla } from "../../components/Skeleton";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { useAuthStore } from "../auth/authStore";
import { useCategorias, useEliminarCategoria } from "./useCategorias";
import ModalCategoria from "./ModalCategoria";
import Boton from "../../components/ui/Boton";

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
      <button onClick={alternar} className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-slate-300 transition-colors hover:bg-slate-700" title={t("common.acciones")}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
        </svg>
      </button>
      {abierto && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setAbierto(false)} />
          <div className="fixed z-20 w-40 animate-pop overflow-hidden rounded-xl border border-[#2a2e3a] shadow-2xl shadow-black/60" style={{ top: pos.top, left: pos.left, backgroundColor: "#13151c" }}>
            <button onClick={() => { setAbierto(false); onEditar(); }} className={item} style={{ color: "#cbd1e0" }}>{t("categoriasPage.editar")}</button>
            <button onClick={() => { setAbierto(false); onEliminar(); }} className={item} style={{ color: "#f87171" }}>{t("categoriasPage.eliminar")}</button>
          </div>
        </>
      )}
    </div>
  );
}

export default function CategoriasPage() {
  const { t } = useTranslation();
  const usuario = useAuthStore((s) => s.usuario);
  const esAdmin = usuario?.rol === "admin";
  const { data: categorias, isLoading, isError } = useCategorias(esAdmin);
  const eliminarCategoria = useEliminarCategoria();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState(null);

  if (!esAdmin) return <Navigate to="/productos" replace />;

  function abrirCrear() { setCategoriaEditando(null); setModalAbierto(true); }
  function abrirEditar(categoria) { setCategoriaEditando(categoria); setModalAbierto(true); }
  function cerrarModal() { setModalAbierto(false); setCategoriaEditando(null); }

  async function pedirDestinoYReasignar(categoria) {
    const otras = (categorias || []).filter((c) => c._id !== categoria._id);
    if (otras.length === 0) {
      Swal.fire({ icon: "warning", title: t("categoriasPage.sinDestinoTitulo"), text: t("categoriasPage.sinDestinoTexto") });
      return;
    }
    const { value: destino } = await Swal.fire({
      title: t("categoriasPage.reasignarTitulo"),
      html: `<div style='text-align:left;font-size:14px'>${t("categoriasPage.reasignarTexto", { nombre: categoria.nombre })}</div>`,
      input: "select",
      inputOptions: otras.reduce((acc, c) => { acc[c.nombre] = c.nombre; return acc; }, {}),
      inputPlaceholder: t("categoriasPage.reasignarPlaceholder"),
      showCancelButton: true,
      confirmButtonText: t("categoriasPage.reasignarConfirmar"),
      cancelButtonText: t("categoriasPage.cancelar"),
      confirmButtonColor: "#dc2626",
      inputValidator: (v) => !v && t("categoriasPage.reasignarObligatorio")
    });
    if (!destino) return;
    try {
      await eliminarCategoria.mutateAsync({ id: categoria._id, reasignarA: destino });
      Swal.fire({ icon: "success", title: t("categoriasPage.eliminada") });
    } catch (error) {
      Swal.fire({ icon: "error", title: t("categoriasPage.error"), text: error.message });
    }
  }

  async function manejarEliminar(categoria) {
    const resultado = await Swal.fire({
      title: t("categoriasPage.confirmEliminar"),
      html: "<div style='text-align:left;font-size:14px'>" + t("categoriasPage.vasAEliminar", { nombre: categoria.nombre }) + "</div>",
      icon: "warning", showCancelButton: true,
      confirmButtonText: t("categoriasPage.eliminar"), cancelButtonText: t("categoriasPage.cancelar"), confirmButtonColor: "#dc2626"
    });
    if (!resultado.isConfirmed) return;
    try {
      await eliminarCategoria.mutateAsync({ id: categoria._id });
      Swal.fire({ icon: "success", title: t("categoriasPage.eliminada") });
    } catch (error) {
      if (error.codigo === "CATEGORIA_CON_PRODUCTOS") {
        await pedirDestinoYReasignar(categoria);
        return;
      }
      Swal.fire({ icon: "error", title: t("categoriasPage.error"), text: error.message });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">{t("categoriasPage.subtitulo")}</p>
        <Boton onClick={abrirCrear}>+ {t("categoriasPage.nueva")}</Boton>
      </div>

      {isLoading && <SkeletonTabla filas={5} />}
      {isError && <p className="text-sm text-red-400">{t("categoriasPage.error")}</p>}
      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">{t("categoriasPage.nombre")}</th>
                <th className="px-4 py-3 text-right">{t("common.acciones")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {(categorias || []).map((c) => (
                <tr key={c._id} className="bg-slate-950/50 transition-colors hover:bg-slate-900/50">
                  <td className="px-4 py-3 font-semibold text-white">{c.nombre}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <MenuAcciones t={t} onEditar={() => abrirEditar(c)} onEliminar={() => manejarEliminar(c)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(categorias || []).length === 0 && (
            <EmptyState icono="🏷️" titulo={t("categoriasPage.sinCategorias")} descripcion="" />
          )}
        </div>
      )}
      {modalAbierto && <ModalCategoria categoria={categoriaEditando} onCerrar={cerrarModal} />}
    </div>
  );
}

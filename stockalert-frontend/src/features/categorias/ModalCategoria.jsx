import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { useCrearCategoria, useEditarCategoria } from "./useCategorias";
import Boton from "../../components/ui/Boton";
import { Input } from "../../components/ui/Input";
export default function ModalCategoria({ categoria, onCerrar }) {
  const { t } = useTranslation();
  const esEdicion = Boolean(categoria);
  const crearCategoria = useCrearCategoria();
  const editarCategoria = useEditarCategoria();
  const [nombre, setNombre] = useState("");
  useEffect(() => {
    setNombre(categoria?.nombre || "");
  }, [categoria]);
  async function manejarGuardar(e) {
    e.preventDefault();
    const limpio = nombre.trim();
    if (!limpio) {
      Swal.fire({ icon: "warning", title: t("swal.datosIncompletos"), text: t("categoriasPage.nombreObligatorio") });
      return;
    }
    try {
      if (esEdicion) {
        await editarCategoria.mutateAsync({ id: categoria._id, datos: { nombre: limpio } });
        Swal.fire({ icon: "success", title: t("categoriasPage.actualizada"), timer: 1400, showConfirmButton: false });
      } else {
        await crearCategoria.mutateAsync({ nombre: limpio });
        Swal.fire({ icon: "success", title: t("categoriasPage.creada"), timer: 1400, showConfirmButton: false });
      }
      onCerrar();
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    }
  }
  const cargando = crearCategoria.isPending || editarCategoria.isPending;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-fast" onClick={onCerrar}>
      <div className="w-full max-w-md animate-pop rounded-2xl border border-slate-800 bg-slate-900 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-base font-bold text-white">{esEdicion ? t("categoriasPage.editar") : t("categoriasPage.nueva")}</h2>
        <form onSubmit={manejarGuardar} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-slate-400">{t("categoriasPage.nombre")}</label>
            <Input placeholder={t("categoriasPage.ejNombre")} value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />
          </div>
          <div className="flex gap-2 pt-2">
            <Boton type="submit" disabled={cargando} className="flex-1">
              {cargando ? t("swal.guardando") : esEdicion ? t("categoriasPage.guardarCambios") : t("categoriasPage.crear")}
            </Boton>
            <Boton type="button" variante="secondary" onClick={onCerrar} className="flex-1">
              {t("productos.cancelar")}
            </Boton>
          </div>
        </form>
      </div>
    </div>
  );
}

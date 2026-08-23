import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { useCrearSucursal, useEditarSucursal } from "./useSucursales";
import Boton from "../../components/ui/Boton";
import { Input } from "../../components/ui/Input";
export default function ModalSucursal({ sucursal, onCerrar }) {
  const { t } = useTranslation();
  const esEdicion = Boolean(sucursal);
  const crearSucursal = useCrearSucursal();
  const editarSucursal = useEditarSucursal();
  const [zona, setZona] = useState("");
  const [numero, setNumero] = useState("");
  const [direccion, setDireccion] = useState("");
  useEffect(() => {
    if (sucursal) {
      setZona(sucursal.zona ?? "");
      setNumero(sucursal.numero ?? "");
      setDireccion(sucursal.direccion || "");
    } else {
      setZona("");
      setNumero("");
      setDireccion("");
    }
  }, [sucursal]);
  async function manejarGuardar(e) {
    e.preventDefault();
    if (zona === "" || numero === "") {
      Swal.fire({ icon: "warning", title: t("swal.datosIncompletos"), text: t("sucursal.zonaNumeroObligatorios") });
      return;
    }
    const datos = { zona: Number(zona), numero: Number(numero), direccion: direccion.trim() };
    try {
      if (esEdicion) {
        await editarSucursal.mutateAsync({ id: sucursal._id, datos });
        Swal.fire({ icon: "success", title: t("sucursal.actualizada"), timer: 1400, showConfirmButton: false });
      } else {
        await crearSucursal.mutateAsync(datos);
        Swal.fire({ icon: "success", title: t("sucursal.creada"), text: t("sucursal.listaParaUsar", { zona, numero }), timer: 1600, showConfirmButton: false });
      }
      onCerrar();
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    }
  }
  const cargando = crearSucursal.isPending || editarSucursal.isPending;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-fast" onClick={onCerrar}>
      <div className="w-full max-w-md animate-pop rounded-2xl border border-slate-800 bg-slate-900 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-base font-bold text-white">{esEdicion ? t("sucursal.editar") : t("sucursal.nueva")}</h2>
        <form onSubmit={manejarGuardar} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-slate-400">{t("sucursal.zona")}</label>
            <Input type="number" placeholder={t("sucursal.ejZona")} value={zona} onChange={(e) => setZona(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">{t("sucursal.numero")}</label>
            <Input type="number" placeholder={t("sucursal.ejNumero")} value={numero} onChange={(e) => setNumero(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">{t("sucursal.direccion")}</label>
            <Input placeholder={t("sucursal.ejDireccion")} value={direccion} onChange={(e) => setDireccion(e.target.value)} />
          </div>
          <div className="flex gap-2 pt-2">
            <Boton type="submit" disabled={cargando} className="flex-1">
              {cargando ? t("swal.guardando") : esEdicion ? t("sucursal.guardarCambios") : t("sucursal.crear")}
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

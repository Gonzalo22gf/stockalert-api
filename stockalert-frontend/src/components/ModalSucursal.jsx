import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useCrearSucursal, useEditarSucursal } from "../hooks/useSucursales";

export default function ModalSucursal({ sucursal, onCerrar }) {
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
      Swal.fire({ icon: "warning", title: "Datos incompletos", text: "Zona y número son obligatorios." });
      return;
    }

    const datos = { zona: Number(zona), numero: Number(numero), direccion: direccion.trim() };

    try {
      if (esEdicion) {
        await editarSucursal.mutateAsync({ id: sucursal._id, datos });
        Swal.fire({ icon: "success", title: "Sucursal actualizada", timer: 1400, showConfirmButton: false });
      } else {
        await crearSucursal.mutateAsync(datos);
        Swal.fire({ icon: "success", title: "Sucursal creada", text: `"Zona ${zona}, ${numero}" lista para usar.`, timer: 1600, showConfirmButton: false });
      }
      onCerrar();
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    }
  }

  const cargando = crearSucursal.isPending || editarSucursal.isPending;
  const inputClase =
    "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onCerrar}>
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-base font-bold text-white">{esEdicion ? "Editar sucursal" : "🏪 Nueva sucursal"}</h2>

        <form onSubmit={manejarGuardar} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Zona</label>
            <input className={inputClase} type="number" placeholder="Ej: 1" value={zona} onChange={(e) => setZona(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Número de sucursal</label>
            <input className={inputClase} type="number" placeholder="Ej: 402" value={numero} onChange={(e) => setNumero(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Dirección (opcional)</label>
            <input className={inputClase} placeholder="Av. Corrientes 1234" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={cargando}
              className="flex-1 rounded-lg bg-brand py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {cargando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear sucursal"}
            </button>
            <button
              type="button"
              onClick={onCerrar}
              className="flex-1 rounded-lg border border-slate-700 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
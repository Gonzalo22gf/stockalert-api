import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useCategorias } from "../categorias/useCategorias";
import Swal from "sweetalert2";
import { useActualizarProducto } from "./useProductos";
import Boton from "../../components/ui/Boton";
import { Input, Select } from "../../components/ui/Input";


function fechaParaInput(vencimiento) {
  if (!vencimiento) return "";
  return new Date(vencimiento).toISOString().split("T")[0];
}

export default function ModalEditarProducto({ producto, onCerrar }) {
  const { t } = useTranslation();
  const { data: categorias = [] } = useCategorias();
  const actualizarProducto = useActualizarProducto();
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [precio, setPrecio] = useState("");
  const [lote, setLote] = useState("");
  const [stock, setStock] = useState("");
  const [vencimiento, setVencimiento] = useState("");
  const [codigoBarras, setCodigoBarras] = useState("");
  const [vence, setVence] = useState(true);

  useEffect(() => {
    if (producto) {
      setNombre(producto.nombre || "");
      setCategoria(producto.categoria || "");
      setPrecio(producto.precio ?? "");
      setLote(producto.lote || "");
      setStock(producto.stock ?? "");
      setVencimiento(fechaParaInput(producto.vencimiento));
      setCodigoBarras(producto.codigoBarras || "");
      setVence(producto.vence !== false);
    }
  }, [producto]);

  if (!producto) return null;

  async function manejarGuardar(e) {
    e.preventDefault();
    if (!nombre || !categoria || precio === "" || stock === "" || (vence && !vencimiento)) {
      Swal.fire({ icon: "warning", title: t("swal.datosIncompletos"), text: t("swal.completaCampos") });
      return;
    }
    const datos = {
      nombre,
      categoria,
      precio: Number(precio),
      lote,
      stock: Number(stock),
      vence,
      codigoBarras: codigoBarras.trim(),
      ...(vence
        ? { vencimiento, lotes: [{ numero: lote, stock: Number(stock), vencimiento }] }
        : { vencimiento: null, lotes: [] })
    };
    try {
      await actualizarProducto.mutateAsync({ id: producto._id, datos });
      Swal.fire({ icon: "success", title: t("swal.prodActualizado"), timer: 1400, showConfirmButton: false });
      onCerrar();
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-fast" onClick={onCerrar}>
      <div
        className="w-full max-w-lg animate-pop rounded-2xl border border-slate-800 bg-slate-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-base font-bold text-white">Editar producto</h2>
        <form onSubmit={manejarGuardar} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Nombre</label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">{t("productos.categoria")}</label>
              <Select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                <option value="">{t("productos.categoria")}</option>
                {categorias.map((c) => (
                  <option key={c._id} value={c.nombre}>{c.nombre}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Precio $</label>
              <Input type="number" value={precio} onChange={(e) => setPrecio(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">N° de lote</label>
              <Input value={lote} onChange={(e) => setLote(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Stock</label>
              <Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">{t("form.codigoBarrasEan")}</label>
              <Input value={codigoBarras} onChange={(e) => setCodigoBarras(e.target.value)} placeholder="Opcional" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">{t("form.fechaVencimiento")}</label>
              <Input type="date" value={vencimiento} disabled={!vence} onChange={(e) => setVencimiento(e.target.value)} />
              <label className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                <input type="checkbox" checked={!vence} onChange={(e) => setVence(!e.target.checked)} />
                {t("form.noVence")}
              </label>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Boton type="submit" disabled={actualizarProducto.isPending} className="flex-1">
              {actualizarProducto.isPending ? t("swal.guardando") : t("swal.guardarCambios")}
            </Boton>
            <Boton type="button" variante="secondary" onClick={onCerrar} className="flex-1">
              Cancelar
            </Boton>
          </div>
        </form>
      </div>
    </div>
  );
}

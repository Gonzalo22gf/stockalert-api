import { useState } from "react";
import { ExternalLink, Plus, Pencil, Trash2, Link } from "lucide-react";
import Swal from "sweetalert2";
import { useLinks, useCrearLink, useEditarLink, useBorrarLink } from "./useLinks";
import { useAuthStore } from "../auth/authStore";
import Boton from "../../components/ui/Boton";
import { Input } from "../../components/ui/Input";

export default function LinksPage() {
  const { data: links = [], isLoading } = useLinks();
  const crearLink = useCrearLink();
  const editarLink = useEditarLink();
  const borrarLink = useBorrarLink();
  const usuario = useAuthStore((s) => s.usuario);
  const esAdmin = usuario?.rol === "admin";

  const [nombre, setNombre] = useState("");
  const [url, setUrl] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [editNombre, setEditNombre] = useState("");
  const [editUrl, setEditUrl] = useState("");

  async function manejarCrear(e) {
    e.preventDefault();
    if (!nombre.trim() || !url.trim()) return;
    const urlFinal = url.startsWith("http") ? url.trim() : "https://" + url.trim();
    try {
      await crearLink.mutateAsync({ nombre: nombre.trim(), url: urlFinal });
      setNombre("");
      setUrl("");
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    }
  }

  function manejarEditar(link) {
    setEditandoId(link._id);
    setEditNombre(link.nombre);
    setEditUrl(link.url);
  }

  async function guardarEdicion(id) {
    if (!editNombre.trim() || !editUrl.trim()) return;
    try {
      await editarLink.mutateAsync({ id, datos: { nombre: editNombre.trim(), url: editUrl.trim() } });
      setEditandoId(null);
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    }
  }

  async function manejarBorrar(id, nom) {
    const { isConfirmed } = await Swal.fire({
      icon: "warning",
      title: "Borrar link",
      text: 'Vas a borrar el link "' + nom + '". Esta accion no se puede deshacer.',
      showCancelButton: true,
      confirmButtonText: "Borrar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#ef4444"
    });
    if (!isConfirmed) return;
    try {
      await borrarLink.mutateAsync(id);
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    }
  }

  const puedeAgregar = esAdmin && links.length < 10;

  return (
    <div className="animate-rise space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-lg font-bold text-white">Links frecuentes</h1>
        <p className="text-sm text-slate-400">
          {esAdmin ? "Accesos rapidos de tu empresa. Hasta 10 links." : "Accesos rapidos de tu empresa."}
        </p>
      </div>

      {/* Formulario agregar — solo admin */}
      {esAdmin && (
        puedeAgregar ? (
          <form onSubmit={manejarCrear} className="rounded-xl border border-border-soft bg-panel p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-300">Agregar link</p>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Nombre (ej: Panel Brevo)" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={50} />
              <Input placeholder="URL (ej: https://...)" value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>
            <Boton type="submit" disabled={crearLink.isPending || !nombre.trim() || !url.trim()} className="w-full">
              <Plus size={14} className="inline mr-1" />
              {crearLink.isPending ? "Guardando..." : "Agregar link"}
            </Boton>
          </form>
        ) : (
          <p className="text-xs text-slate-500 text-center">Llegaste al maximo de 10 links. Borra uno para agregar otro.</p>
        )
      )}

      {/* Lista de links */}
      {isLoading ? (
        <p className="text-sm text-slate-500 text-center">Cargando...</p>
      ) : links.length === 0 ? (
        <div className="rounded-xl border border-border-soft bg-panel p-8 text-center">
          <Link size={32} className="mx-auto mb-3 text-slate-700" />
          <p className="text-sm text-slate-500">No hay links todavia.</p>
          {esAdmin && <p className="text-xs text-slate-600">Agrega los accesos rapidos de tu empresa.</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {links.map((link) => (
            <div key={link._id} className="rounded-xl border border-border-soft bg-panel p-3">
              {esAdmin && editandoId === link._id ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={editNombre} onChange={(e) => setEditNombre(e.target.value)} maxLength={50} />
                    <Input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <Boton onClick={() => guardarEdicion(link._id)} disabled={editarLink.isPending} className="flex-1 text-xs py-1.5">Guardar</Boton>
                    <Boton variante="secondary" onClick={() => setEditandoId(null)} className="flex-1 text-xs py-1.5">Cancelar</Boton>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10">
                    <Link size={14} className="text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{link.nombre}</p>
                    <p className="text-xs text-slate-500 truncate">{link.url}</p>
                  </div>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-brand-400 transition-colors" title="Abrir link">
                    <ExternalLink size={15} />
                  </a>
                  {esAdmin && (
                    <>
                      <button onClick={() => manejarEditar(link)} className="text-slate-500 hover:text-amber-400 transition-colors" title="Editar">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => manejarBorrar(link._id, link.nombre)} className="text-slate-500 hover:text-red-400 transition-colors" title="Borrar">
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-600 text-center">{links.length}/10 links</p>
    </div>
  );
}

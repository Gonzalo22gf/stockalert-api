import { create } from "zustand";

const tokenGuardado = localStorage.getItem("tokenStockAlert") || "";
const usuarioGuardado = JSON.parse(localStorage.getItem("usuarioStockAlert") || "null");

export const useAuthStore = create((set) => ({
  token: tokenGuardado,
  usuario: usuarioGuardado,

  guardarSesion: (data) => {
    const usuario = {
      _id: data._id,
      nombre: data.nombre,
      email: data.email,
      rol: data.rol,
      sucursal: data.sucursal
    };
    localStorage.setItem("tokenStockAlert", data.token);
    localStorage.setItem("usuarioStockAlert", JSON.stringify(usuario));
    set({ token: data.token, usuario });
  },

  cerrarSesion: () => {
    localStorage.removeItem("tokenStockAlert");
    localStorage.removeItem("usuarioStockAlert");
    set({ token: "", usuario: null });
  }
}));
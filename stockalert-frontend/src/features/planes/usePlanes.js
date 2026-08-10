import { useState } from "react";
import { crearCheckout } from "./planes.api";
import Swal from "sweetalert2";

export function usePlanes() {
  const [cargando, setCargando] = useState(null);

  async function irACheckout(plan) {
    setCargando(plan);
    try {
      const data = await crearCheckout(plan);
      if (data.proximamente) {
        Swal.fire({ icon: "info", title: "Proximamente", text: data.mensaje });
        return;
      }
      window.location.href = data.url;
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: e.message });
    } finally {
      setCargando(null);
    }
  }

  return { irACheckout, cargando };
}

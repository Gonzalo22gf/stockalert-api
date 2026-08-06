import { esPlanError } from "../lib/PlanError";

// Hook para manejar errores de plan en cualquier componente
// Uso: const { manejarError } = usePlanError()
// En el catch: manejarError(error) — si es PlanError muestra el modal, si no lanza el Swal
export function usePlanError() {
  function manejarError(error, fallback) {
    if (esPlanError(error)) {
      window.dispatchEvent(new CustomEvent("plan-error", { detail: { codigo: error.codigo } }));
    } else if (fallback) {
      fallback(error);
    }
  }
  return { manejarError };
}
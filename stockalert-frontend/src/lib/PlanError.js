// Error especial para limites de plan
// El backend devuelve { mensaje, codigo } cuando PLANES_HABILITADOS=true
export class PlanError extends Error {
  constructor(mensaje, codigo) {
    super(mensaje);
    this.name = "PlanError";
    this.codigo = codigo; // LIMITE_PRODUCTOS | LIMITE_SUCURSALES | LIMITE_USUARIOS | TRIAL_EXPIRADO
  }
}

export function esPlanError(error) {
  return error instanceof PlanError;
}

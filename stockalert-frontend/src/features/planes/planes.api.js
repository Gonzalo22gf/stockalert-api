import { apiPost } from "../../lib/client";
export const crearCheckout = (plan) => apiPost("/api/lemon/checkout", { plan });

import { apiGet } from "./client";

// Trae el histórico de snapshots. Opcionalmente filtra por rango de fechas.
export const obtenerHistorico = (desde, hasta) => {
  const params = new URLSearchParams();
  if (desde) params.append("desde", desde);
  if (hasta) params.append("hasta", hasta);
  const query = params.toString();
  return apiGet("/api/snapshots/historico" + (query ? "?" + query : ""));
};

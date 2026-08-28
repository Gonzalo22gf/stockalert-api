import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../../lib/client";

function agruparPorSemana(snapshots) {
  const semanas = {};
  snapshots.forEach((s) => {
    const fecha = new Date(s.fecha);
    // Lunes de la semana (getDay: 0=domingo). El domingo retrocede 6 dias, no avanza al lunes siguiente.
    const dia = fecha.getDay();
    const desplazamiento = dia === 0 ? -6 : 1 - dia;
    const lunes = new Date(fecha);
    lunes.setDate(fecha.getDate() + desplazamiento);
    const clave = lunes.toISOString().split("T")[0];
    const vencidos = s.totales?.vencidos || 0;
    if (!semanas[clave]) semanas[clave] = { semana: clave, cantidadVencida: 0 };
    // Un snapshot por dia: sumar contaria el mismo producto varios dias. Tomamos el pico semanal.
    semanas[clave].cantidadVencida = Math.max(semanas[clave].cantidadVencida, vencidos);
  });
  return Object.values(semanas).sort((a, b) => a.semana.localeCompare(b.semana));
}

export function useDesperdicios() {
  const hoy = new Date();
  const hace30 = new Date(hoy);
  hace30.setDate(hoy.getDate() - 30);
  const desde = hace30.toISOString().split("T")[0];
  const hasta = hoy.toISOString().split("T")[0];

  return useQuery({
    queryKey: ["desperdicios", desde, hasta],
    queryFn: () => apiGet("/api/snapshots/historico?desde=" + desde + "&hasta=" + hasta),
    select: agruparPorSemana,
    staleTime: 1000 * 60 * 10
  });
}

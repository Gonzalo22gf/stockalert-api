import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../../lib/client";

function agruparPorSemana(snapshots) {
  const semanas = {};
  snapshots.forEach((s) => {
    const fecha = new Date(s.fecha);
    // Obtener el lunes de la semana
    const lunes = new Date(fecha);
    lunes.setDate(fecha.getDate() - fecha.getDay() + 1);
    const clave = lunes.toISOString().split("T")[0];
    if (!semanas[clave]) semanas[clave] = { semana: clave, valorVencido: 0, cantidadVencida: 0 };
    semanas[clave].valorVencido += s.totales?.valorInventario || 0;
    semanas[clave].cantidadVencida += s.totales?.vencidos || 0;
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

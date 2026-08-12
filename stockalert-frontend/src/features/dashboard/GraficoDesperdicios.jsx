import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { useDesperdicios } from "./useDesperdicios";
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function formatearSemana(clave) {
  const [anio, mes, dia] = clave.split("-");
  return dia + "/" + mes;
}

export default function GraficoDesperdicios() {
  const { data: semanas, isLoading, isError } = useDesperdicios();

  if (isLoading) return <div className="h-48 animate-pulse rounded-xl bg-slate-800/50" />;
  if (isError || !semanas?.length) return (
    <div className="flex h-48 items-center justify-center rounded-xl border border-slate-800 bg-white/[0.02]">
      <p className="text-sm text-slate-500">Sin datos suficientes para mostrar el reporte</p>
    </div>
  );

  const labels = semanas.map((s) => "Sem " + formatearSemana(s.semana));
  const valores = semanas.map((s) => s.cantidadVencida);

  const data = {
    labels,
    datasets: [{
      label: "Productos vencidos",
      data: valores,
      backgroundColor: "rgba(239, 68, 68, 0.3)",
      borderColor: "rgba(239, 68, 68, 0.8)",
      borderWidth: 1,
      borderRadius: 6
    }]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => " " + ctx.raw + " productos vencidos esa semana"
        }
      }
    },
    scales: {
      x: { grid: { color: "rgba(148,163,184,0.08)" }, ticks: { color: "#94a3b8", font: { size: 11 } } },
      y: { grid: { color: "rgba(148,163,184,0.08)" }, ticks: { color: "#94a3b8", font: { size: 11 } }, beginAtZero: true }
    }
  };

  const totalVencidos = semanas.reduce((acc, s) => acc + s.cantidadVencida, 0);

  return (
    <div className="rounded-2xl border border-slate-800 bg-white/[0.02] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Desperdicios ultimos 30 dias</h3>
          <p className="text-xs text-slate-500">Productos vencidos por semana</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-red-400">{totalVencidos}</p>
          <p className="text-xs text-slate-500">total vencidos</p>
        </div>
      </div>
      <Bar data={data} options={options} />
    </div>
  );
}

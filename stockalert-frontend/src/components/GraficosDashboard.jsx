import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const opcionesBase = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: "#cbd5e1", font: { size: 11 } } }
  },
  scales: {
    x: { ticks: { color: "#94a3b8", font: { size: 10 } }, grid: { color: "#1e293b" } },
    y: { ticks: { color: "#94a3b8", font: { size: 10 } }, grid: { color: "#1e293b" } }
  }
};

const opcionesDona = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: "bottom", labels: { color: "#cbd5e1", font: { size: 11 } } } }
};

function Tarjeta({ titulo, children }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <h3 className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">{titulo}</h3>
      <div className="h-56">{children}</div>
    </div>
  );
}

export default function GraficosDashboard({ productos }) {
  if (!productos || productos.length === 0) {
    return <p className="text-sm text-slate-500">No hay datos suficientes para mostrar gráficos.</p>;
  }

  const hoy = new Date();

  let enBuenEstado = 0;
  let porVencer = 0;
  let vencidos = 0;
  productos.forEach((p) => {
    const dias = Math.ceil((new Date(p.vencimiento) - hoy) / (1000 * 60 * 60 * 24));
    if (dias < 0) vencidos++;
    else if (dias <= 7) porVencer++;
    else enBuenEstado++;
  });

  const porCategoria = {};
  const stockPorCategoria = {};
  const valorPorCategoria = {};
  productos.forEach((p) => {
    porCategoria[p.categoria] = (porCategoria[p.categoria] || 0) + 1;
    stockPorCategoria[p.categoria] = (stockPorCategoria[p.categoria] || 0) + Number(p.stock || 0);
    valorPorCategoria[p.categoria] = (valorPorCategoria[p.categoria] || 0) + Number(p.stock || 0) * Number(p.precio || 0);
  });

  const categorias = Object.keys(porCategoria);

  const datosEstado = {
    labels: ["En buen estado", "Por vencer", "Vencidos"],
    datasets: [
      {
        data: [enBuenEstado, porVencer, vencidos],
        backgroundColor: ["#22c55e", "#eab308", "#ef4444"],
        borderColor: "#0f172a",
        borderWidth: 2
      }
    ]
  };

  const datosCategoria = {
    labels: categorias,
    datasets: [{ label: "Productos", data: categorias.map((c) => porCategoria[c]), backgroundColor: "#6366f1" }]
  };

  const datosStock = {
    labels: categorias,
    datasets: [{ label: "Stock", data: categorias.map((c) => stockPorCategoria[c]), backgroundColor: "#06b6d4" }]
  };

  const datosValor = {
    labels: categorias,
    datasets: [{ label: "Valor inventario", data: categorias.map((c) => valorPorCategoria[c]), backgroundColor: "#22c55e" }]
  };

  return (
    <div>
      <h2 className="mb-4 text-sm font-semibold text-white">📊 Dashboard Ejecutivo</h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Tarjeta titulo="Estado de productos">
          <Doughnut data={datosEstado} options={opcionesDona} />
        </Tarjeta>
        <Tarjeta titulo="Productos por categoría">
          <Bar data={datosCategoria} options={opcionesBase} />
        </Tarjeta>
        <Tarjeta titulo="Stock por categoría">
          <Bar data={datosStock} options={opcionesBase} />
        </Tarjeta>
        <Tarjeta titulo="Valor de inventario">
          <Bar data={datosValor} options={opcionesBase} />
        </Tarjeta>
      </div>
    </div>
  );
}
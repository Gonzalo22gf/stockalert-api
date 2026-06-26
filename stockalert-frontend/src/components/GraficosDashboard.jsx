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

const PALETA = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#a855f7", "#06b6d4", "#ec4899"];

function Tarjeta({ titulo, subtitulo, children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-border-soft bg-panel p-5 animate-fade ${className}`}>
      <div className="mb-4">
        <h3 className="text-sm font-bold text-white">{titulo}</h3>
        {subtitulo && <p className="text-[11px] text-slate-500">{subtitulo}</p>}
      </div>
      {children}
    </div>
  );
}

const tooltipEstilo = {
  backgroundColor: "#1a1d26",
  titleColor: "#f1f3f8",
  bodyColor: "#cbd1e0",
  borderColor: "#2a2e3a",
  borderWidth: 1,
  padding: 10,
  cornerRadius: 8,
  displayColors: true,
  boxPadding: 4
};

export default function GraficosDashboard({ productos }) {
  if (!productos || productos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-panel/50 px-6 py-14 text-center">
        <p className="text-sm text-slate-500">No hay datos suficientes para mostrar gráficos.</p>
      </div>
    );
  }

  const hoy = new Date();

  // Estado de productos
  let enBuenEstado = 0, porVencer = 0, vencidos = 0;
  productos.forEach((p) => {
    const dias = Math.ceil((new Date(p.vencimiento) - hoy) / (1000 * 60 * 60 * 24));
    if (dias < 0) vencidos++;
    else if (dias <= 7) porVencer++;
    else enBuenEstado++;
  });
  const total = productos.length;

  // Por categoría
  const porCategoria = {};
  const stockPorCategoria = {};
  const valorPorCategoria = {};
  productos.forEach((p) => {
    porCategoria[p.categoria] = (porCategoria[p.categoria] || 0) + 1;
    stockPorCategoria[p.categoria] = (stockPorCategoria[p.categoria] || 0) + Number(p.stock || 0);
    valorPorCategoria[p.categoria] = (valorPorCategoria[p.categoria] || 0) + Number(p.stock || 0) * Number(p.precio || 0);
  });

  const categorias = Object.keys(porCategoria);

  // Dona de estado
  const datosEstado = {
    labels: ["En buen estado", "Por vencer", "Vencido"],
    datasets: [{
      data: [enBuenEstado, porVencer, vencidos],
      backgroundColor: ["#10b981", "#f59e0b", "#ef4444"],
      borderColor: "#13151c",
      borderWidth: 3,
      hoverOffset: 6
    }]
  };

  const opcionesDona = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: "#cbd1e0", font: { size: 12, family: "Inter" }, padding: 14, usePointStyle: true, pointStyle: "circle" }
      },
      tooltip: {
        ...tooltipEstilo,
        callbacks: {
          label: (ctx) => {
            const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(0) : 0;
            return ` ${ctx.label}: ${ctx.raw} (${pct}%)`;
          }
        }
      }
    }
  };

  // Plugin para texto central de la dona
  const textoCentral = {
    id: "textoCentral",
    afterDraw(chart) {
      const { ctx, chartArea } = chart;
      if (!chartArea) return;
      const x = (chartArea.left + chartArea.right) / 2;
      const y = (chartArea.top + chartArea.bottom) / 2;
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.font = "800 26px Inter, sans-serif";
      ctx.fillText(String(total), x, y - 8);
      ctx.fillStyle = "#8b90a0";
      ctx.font = "500 11px Inter, sans-serif";
      ctx.fillText("productos", x, y + 14);
      ctx.restore();
    }
  };

  // Barras horizontales reutilizable
  function barrasH(data, colorIdx, formato) {
    return {
      labels: categorias,
      datasets: [{
        data: categorias.map((c) => data[c]),
        backgroundColor: PALETA[colorIdx],
        borderRadius: 6,
        barThickness: 18
      }]
    };
  }

  function opcionesBarrasH(formato) {
    return {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltipEstilo,
          callbacks: {
            label: (ctx) => formato ? ` ${formato(ctx.raw)}` : ` ${ctx.raw}`
          }
        }
      },
      scales: {
        x: { ticks: { color: "#6b7280", font: { size: 10 } }, grid: { color: "#1c1f29" }, border: { display: false } },
        y: { ticks: { color: "#cbd1e0", font: { size: 11, family: "Inter" } }, grid: { display: false }, border: { display: false } }
      }
    };
  }

  const fmtMoneda = (v) => "$ " + Number(v).toLocaleString("es-AR");

  return (
    <div className="space-y-3.5">
      <h2 className="text-sm font-bold text-white">📊 Análisis del inventario</h2>

      {/* Fila 1: Dona protagonista + Productos por categoría */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <Tarjeta titulo="Estado general" subtitulo="Distribución por vencimiento">
          <div className="h-64">
            <Doughnut data={datosEstado} options={opcionesDona} plugins={[textoCentral]} />
          </div>
        </Tarjeta>

        <Tarjeta titulo="Productos por categoría" subtitulo="Cantidad de ítems distintos">
          <div className="h-64">
            <Bar data={barrasH(porCategoria, 0)} options={opcionesBarrasH()} />
          </div>
        </Tarjeta>
      </div>

      {/* Fila 2: Valor + Stock */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <Tarjeta titulo="Valor por categoría" subtitulo="Dónde está concentrado el capital">
          <div className="h-56">
            <Bar data={barrasH(valorPorCategoria, 1)} options={opcionesBarrasH(fmtMoneda)} />
          </div>
        </Tarjeta>

        <Tarjeta titulo="Unidades en stock" subtitulo="Cantidad total por categoría">
          <div className="h-56">
            <Bar data={barrasH(stockPorCategoria, 5)} options={opcionesBarrasH()} />
          </div>
        </Tarjeta>
      </div>
    </div>
  );
}
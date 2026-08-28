// Configuracion visual compartida de los graficos del dashboard (Chart.js).
// Paleta, estilo de tooltip, generadores de opciones y plugin de texto central.
// Se mantiene fuera del componente para no recrearlo en cada render y poder reusarlo.

export const PALETA = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#a855f7", "#06b6d4", "#ec4899"];

export const tooltipEstilo = {
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

// Opciones para las barras horizontales (rankings y categorias).
// formato: funcion opcional para formatear el valor en el tooltip (ej. moneda).
export function opcionesBarrasH(formato) {
  return {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipEstilo,
        callbacks: {
          label: (ctx) => formato ? " " + formato(ctx.raw) : " " + ctx.raw
        }
      }
    },
    scales: {
      x: { ticks: { color: "#6b7280", font: { size: 10 } }, grid: { color: "#1c1f29" }, border: { display: false } },
      y: { ticks: { color: "#cbd1e0", font: { size: 11, family: "Inter" } }, grid: { display: false }, border: { display: false } }
    }
  };
}

// Opciones de la dona de estado. total: cantidad de productos (para el %).
export function opcionesDona(total) {
  return {
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
            return " " + ctx.label + ": " + ctx.raw + " (" + pct + "%)";
          }
        }
      }
    }
  };
}

// Opciones de la dona de tiendas en riesgo. sufijo: texto tras el numero en el tooltip.
export function opcionesDonaRiesgo(sufijo) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "60%",
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: "#cbd1e0", font: { size: 11, family: "Inter" }, padding: 10, usePointStyle: true, pointStyle: "circle" }
      },
      tooltip: {
        ...tooltipEstilo,
        callbacks: { label: (ctx) => " " + ctx.label + ": " + ctx.raw + " " + sufijo }
      }
    }
  };
}

// Plugin que dibuja un numero grande + subtitulo en el centro de la dona de estado.
export function crearTextoCentral(total, subtitulo) {
  return {
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
      ctx.fillText(subtitulo, x, y + 14);
      ctx.restore();
    }
  };
}

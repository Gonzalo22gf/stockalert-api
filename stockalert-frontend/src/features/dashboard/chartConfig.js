// Configuracion visual compartida de los graficos del dashboard (Chart.js).
// Paleta, estilo de tooltip, generadores de opciones y plugin de texto central.
// Se mantiene fuera del componente para no recrearlo en cada render y poder reusarlo.

export const PALETA = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#a855f7", "#06b6d4", "#ec4899"];

// Chart.js dibuja en canvas y NO toma los overrides CSS de modo claro, asi que los colores
// de texto se eligen aca segun el tema (mira la clase light del <html>).
function esClaro() {
  return typeof document !== "undefined" && document.documentElement.classList.contains("light");
}
function colores() {
  return esClaro()
    ? { textoFuerte: "#1c1917", textoSuave: "#57534e", grid: "#e6ddcb", centro: "#1c1917", centroSub: "#78716c" }
    : { textoFuerte: "#cbd1e0", textoSuave: "#6b7280", grid: "#1c1f29", centro: "#ffffff", centroSub: "#8b90a0" };
}

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
  const c = colores();
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
      x: { ticks: { color: c.textoSuave, font: { size: 10 } }, grid: { color: c.grid }, border: { display: false } },
      y: { ticks: { color: c.textoFuerte, font: { size: 11, family: "Inter" } }, grid: { display: false }, border: { display: false } }
    }
  };
}

// Opciones de la dona de estado. total: cantidad de productos (para el %).
export function opcionesDona(total) {
  const c = colores();
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: c.textoFuerte, font: { size: 12, family: "Inter" }, padding: 14, usePointStyle: true, pointStyle: "circle" }
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
  const c = colores();
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "60%",
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: c.textoFuerte, font: { size: 11, family: "Inter" }, padding: 10, usePointStyle: true, pointStyle: "circle" }
      },
      tooltip: {
        ...tooltipEstilo,
        callbacks: { label: (ctx) => " " + ctx.label + ": " + ctx.raw + " " + sufijo }
      }
    }
  };
}

// Plugin que dibuja un numero grande + subtitulo en el centro de la dona de estado.
// Formatea el numero del centro de la dona en compacto para que entre siempre (1000 -> 1k, 50000 -> 50k).
function numeroCompacto(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + "k";
  return String(n);
}
export function crearTextoCentral(total, subtitulo) {
  return {
    id: "textoCentral",
    afterDraw(chart) {
      const { ctx, chartArea } = chart;
      if (!chartArea) return;
      const c = colores();
      const x = (chartArea.left + chartArea.right) / 2;
      const y = (chartArea.top + chartArea.bottom) / 2;
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = c.centro;
      ctx.font = "800 26px Inter, sans-serif";
      ctx.fillText(numeroCompacto(Number(total) || 0), x, y - 8);
      ctx.fillStyle = c.centroSub;
      ctx.font = "500 11px Inter, sans-serif";
      ctx.fillText(subtitulo, x, y + 14);
      ctx.restore();
    }
  };
}

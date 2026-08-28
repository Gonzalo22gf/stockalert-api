import { Doughnut, Bar } from "react-chartjs-2";
import { useTranslation } from "react-i18next";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
} from "chart.js";
import { useDatosGraficos } from "./useDatosGraficos";
import { PALETA, opcionesBarrasH, opcionesDona, opcionesDonaRiesgo, crearTextoCentral } from "./chartConfig";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

function Tarjeta({ titulo, subtitulo, children, className = "" }) {
  return (
    <div className={"rounded-2xl border border-border-soft bg-panel p-5 animate-fade " + className}>
      <div className="mb-4">
        <h3 className="text-sm font-bold text-white">{titulo}</h3>
        {subtitulo && <p className="text-[11px] text-slate-500">{subtitulo}</p>}
      </div>
      {children}
    </div>
  );
}

export default function GraficosDashboard({ productos, resumenSucursales }) {
  const { t } = useTranslation();
  const datos = useDatosGraficos(productos, resumenSucursales);

  if (!productos || productos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-panel/50 px-6 py-14 text-center">
        <p className="text-sm text-slate-500">No hay datos suficientes para mostrar gráficos.</p>
      </div>
    );
  }

  const {
    total, enBuenEstado, porVencer, vencidos, noVence,
    porCategoria, stockPorCategoria, valorPorCategoria, categorias,
    hayResumen, topVencidos, topPorVencer, topRiesgo, topStockBajo
  } = datos;

  const datosEstado = {
    labels: [t("productos.buenEstado"), t("productos.porVencer"), t("productos.vencido"), t("dash.noVence")],
    datasets: [{
      data: [enBuenEstado, porVencer, vencidos, noVence],
      backgroundColor: ["#10b981", "#f59e0b", "#ef4444", "#6b7280"],
      borderColor: "#13151c",
      borderWidth: 3,
      hoverOffset: 6
    }]
  };

  const datosDonaRiesgo = {
    labels: topRiesgo.map((r) => r.nombre),
    datasets: [{
      data: topRiesgo.map((r) => r.riesgo),
      backgroundColor: PALETA.concat(["#f97316", "#14b8a6", "#8b5cf6"]),
      borderColor: "#13151c",
      borderWidth: 3,
      hoverOffset: 6
    }]
  };

  // Construye el dataset de una barra horizontal por categoria (cantidad, valor o stock).
  function barrasH(data, colorIdx) {
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

  // Construye el dataset de un ranking (labels y valores explicitos).
  function barrasRanking(labels, valores, color) {
    return {
      labels,
      datasets: [{
        data: valores,
        backgroundColor: color,
        borderRadius: 6,
        barThickness: 16
      }]
    };
  }

  const fmtMoneda = (v) => "$ " + Number(v).toLocaleString("es-AR");

  return (
    <div className="space-y-3.5">
      <h2 className="text-sm font-bold text-white">📊 Análisis del inventario</h2>

      {/* Fila 1: Dona estado + Productos por categoría */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <Tarjeta titulo={t("dash.estadoGeneral")} subtitulo={t("dash.estadoGeneralSub")}>
          <div className="h-64">
            <Doughnut data={datosEstado} options={opcionesDona(total)} plugins={[crearTextoCentral(total, "productos")]} />
          </div>
        </Tarjeta>

        <Tarjeta titulo={t("dash.prodCategoria")} subtitulo={t("dash.prodCategoriaSub")}>
          <div className="h-64">
            <Bar data={barrasH(porCategoria, 0)} options={opcionesBarrasH()} />
          </div>
        </Tarjeta>
      </div>

      {/* Fila 2: Valor + Stock por categoría */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <Tarjeta titulo={t("dash.valorCategoria")} subtitulo={t("dash.valorCategoriaSub")}>
          <div className="h-56">
            <Bar data={barrasH(valorPorCategoria, 1)} options={opcionesBarrasH(fmtMoneda)} />
          </div>
        </Tarjeta>

        <Tarjeta titulo={t("dash.unidadesStock")} subtitulo={t("dash.unidadesStockSub")}>
          <div className="h-56">
            <Bar data={barrasH(stockPorCategoria, 5)} options={opcionesBarrasH()} />
          </div>
        </Tarjeta>
      </div>

      {/* Fila 3: productos stock bajo + dona tiendas en riesgo */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <Tarjeta titulo={t("dash.menorStock")} subtitulo={t("dash.menorStockSub")}>
          <div className="h-64">
            <Bar
              data={barrasRanking(topStockBajo.map((p) => p.nombre), topStockBajo.map((p) => Number(p.stock || 0)), "#f97316")}
              options={opcionesBarrasH()}
            />
          </div>
        </Tarjeta>

        {hayResumen && topRiesgo.length > 0 ? (
          <Tarjeta titulo={t("dashboard.riesgoTitulo")} subtitulo={t("dashboard.riesgoSubtitulo")}>
            <div className="h-64">
              <Doughnut data={datosDonaRiesgo} options={opcionesDonaRiesgo("ítems en riesgo")} />
            </div>
          </Tarjeta>
        ) : (
          <Tarjeta titulo={t("dashboard.riesgoTitulo")} subtitulo={t("dashboard.riesgoSubtitulo")}>
            <div className="flex h-64 items-center justify-center text-center text-xs text-slate-500">
              {t("dashboard.riesgoMensaje1")}<br />{t("dashboard.riesgoMensaje2")}
            </div>
          </Tarjeta>
        )}
      </div>

      {/* Fila 4: tiendas más vencidos + tiendas más por vencer */}
      {hayResumen && (
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
          <Tarjeta titulo={t("dash.masVencidos")} subtitulo={t("dash.masVencidosSub")}>
            {topVencidos.length > 0 ? (
              <div className="h-64">
                <Bar
                  data={barrasRanking(topVencidos.map((r) => r.sucursal.nombre), topVencidos.map((r) => r.vencidos), "#ef4444")}
                  options={opcionesBarrasH()}
                />
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-xs text-slate-500">No hay productos vencidos. 🎉</div>
            )}
          </Tarjeta>

          <Tarjeta titulo={t("dash.masPorVencer")} subtitulo={t("dash.masPorVencerSub")}>
            {topPorVencer.length > 0 ? (
              <div className="h-64">
                <Bar
                  data={barrasRanking(topPorVencer.map((r) => r.sucursal.nombre), topPorVencer.map((r) => r.porVencer), "#f59e0b")}
                  options={opcionesBarrasH()}
                />
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-xs text-slate-500">No hay productos por vencer. 🎉</div>
            )}
          </Tarjeta>
        </div>
      )}
    </div>
  );
}

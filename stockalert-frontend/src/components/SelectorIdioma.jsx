import { useTranslation } from "react-i18next";

const IDIOMAS = [
  { codigo: "es", etiqueta: "ES", nombre: "Español" },
  { codigo: "en", etiqueta: "EN", nombre: "English" },
  { codigo: "pt", etiqueta: "PT", nombre: "Português" },
  { codigo: "zh-CN", etiqueta: "中文", nombre: "中文（简体）" },
  { codigo: "zh-TW", etiqueta: "繁體", nombre: "中文（繁體）" },
  { codigo: "ja", etiqueta: "日本語", nombre: "日本語" }
];

export default function SelectorIdioma({ colapsado }) {
  const { i18n } = useTranslation();
  const idiomaActual = i18n.language?.split("-")[0] === "zh"
    ? i18n.language
    : i18n.language?.split("-")[0] || "es";

  function cambiarIdioma(codigo) {
    i18n.changeLanguage(codigo);
  }

  const actual = IDIOMAS.find((l) => l.codigo === idiomaActual) || IDIOMAS[0];

  return (
    <div className="relative group">
      <button
        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-[12.5px] font-medium text-slate-500 hover:bg-base/60 hover:text-slate-300 transition-colors"
        title="Idioma / Language"
      >
        <span className="text-sm">{actual.etiqueta}</span>
        {!colapsado && <span className="truncate">{actual.nombre}</span>}
      </button>
      <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block w-44 rounded-xl border border-[#2a2e3a] shadow-2xl shadow-black/60 overflow-hidden z-50" style={{ backgroundColor: "#13151c" }}>
        {IDIOMAS.map((idioma) => (
          <button
            key={idioma.codigo}
            onClick={() => cambiarIdioma(idioma.codigo)}
            className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] font-medium transition-colors hover:bg-[#1a1d26] ${idiomaActual === idioma.codigo ? "text-brand-400" : "text-slate-400"}`}
          >
            <span className="w-8 text-center font-semibold">{idioma.etiqueta}</span>
            <span>{idioma.nombre}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

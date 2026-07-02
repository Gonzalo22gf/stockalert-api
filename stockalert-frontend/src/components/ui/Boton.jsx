// Botón unificado del sistema. Variantes: primary, secondary, danger, success, ghost.
const VARIANTES = {
  primary: "bg-brand text-white hover:opacity-90",
  secondary: "border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700",
  danger: "bg-red-500/15 text-red-400 hover:bg-red-500/25",
  success: "bg-green-600 text-white hover:bg-green-700",
  ghost: "border border-slate-700 text-slate-400 hover:bg-slate-800"
};

const TAMANOS = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base"
};

export default function Boton({
  children,
  variante = "primary",
  tamano = "md",
  className = "",
  disabled = false,
  ...props
}) {
  return (
    <button
      disabled={disabled}
      className={
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed " +
        VARIANTES[variante] +
        " " +
        TAMANOS[tamano] +
        " " +
        className
      }
      {...props}
    >
      {children}
    </button>
  );
}

// Contenedor unificado del sistema (usa los tokens del theme).
export default function Card({ children, className = "", ...props }) {
  return (
    <div
      className={"rounded-xl border border-border-soft bg-panel p-4 " + className}
      {...props}
    >
      {children}
    </div>
  );
}

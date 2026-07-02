// Input y Select unificados del sistema.
const BASE =
  "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand focus:outline-none transition-colors";

export function Input({ className = "", ...props }) {
  return <input className={BASE + " " + className} {...props} />;
}

export function Select({ className = "", children, ...props }) {
  return (
    <select className={BASE + " " + className} {...props}>
      {children}
    </select>
  );
}

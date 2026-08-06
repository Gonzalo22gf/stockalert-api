import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 p-8 text-center">
          <div className="text-5xl">⚠️</div>
          <h1 className="text-lg font-bold text-white">Algo salió mal</h1>
          <p className="text-sm text-slate-400">Ocurrió un error inesperado. Intentá recargar la página.</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand/80"
          >
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

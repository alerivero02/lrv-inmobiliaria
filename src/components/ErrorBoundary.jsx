import { Component } from "react";
import { Link } from "react-router-dom";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-bone px-6 py-12 text-center">
          <h1 className="font-display text-2xl font-semibold text-lrv-text">
            Algo salió mal
          </h1>
          <p className="mt-3 max-w-md text-lrv-muted">
            Ocurrió un error inesperado. Podés reintentar o volver al inicio.
          </p>
          {import.meta.env.DEV && this.state.error?.message && (
            <details className="mt-4 max-w-lg text-left text-sm text-lrv-muted">
              <summary className="cursor-pointer">Detalle técnico</summary>
              <pre className="mt-2 overflow-auto rounded-lrv bg-bone-dark p-3 text-xs">
                {this.state.error.message}
              </pre>
            </details>
          )}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button type="button" className="btn btn-primary" onClick={this.handleRetry}>
              Reintentar
            </button>
            <Link to="/" className="btn btn-outline" onClick={this.handleRetry}>
              Ir al inicio
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

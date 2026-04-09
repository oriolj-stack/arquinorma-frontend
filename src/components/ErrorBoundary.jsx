import React from 'react';

/**
 * ErrorBoundary
 *
 * Catches unhandled JavaScript errors anywhere in the child component tree,
 * logs them, and renders a friendly fallback UI instead of a blank crash.
 *
 * React error boundaries must be class components.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <SomePage />
 *   </ErrorBoundary>
 *
 * Optional props:
 *   fallback   – Custom fallback element (replaces the default card)
 *   label      – Short description used in the error message (e.g. "chat")
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to console in dev; wire to Sentry / Datadog here when available.
    console.error(
      `[ErrorBoundary${this.props.label ? ` — ${this.props.label}` : ''}] Uncaught error:`,
      error,
      info.componentStack
    );
  }

  handleReset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center space-y-5">
            {/* Icon */}
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            {/* Message */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                S'ha produït un error
              </h2>
              <p className="text-sm text-gray-500">
                {this.props.label
                  ? `Un error inesperat ha interromput la secció de ${this.props.label}.`
                  : 'Un error inesperat ha interromput una part de l\'aplicació.'}
              </p>
              {import.meta.env.DEV && this.state.error && (
                <pre className="mt-3 text-left text-xs bg-gray-50 border border-gray-200 rounded p-3 overflow-auto text-red-600 max-h-32">
                  {this.state.error.message}
                </pre>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-5 py-2 text-sm font-medium text-white bg-cte-primary hover:bg-cte-primary-dark rounded-md transition duration-200"
              >
                Tornar a intentar-ho
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition duration-200"
              >
                Recarregar la pàgina
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

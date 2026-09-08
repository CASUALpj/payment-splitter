import { Component, type ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-lg rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15">
            <AlertCircle className="h-6 w-6 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Something went wrong</h3>
          <p className="mt-2 text-sm text-gray-400">
            The app hit an unexpected error. The details below will help track down the cause.
          </p>
          {this.state.error && (
            <pre className="mt-4 overflow-x-auto rounded-lg border border-white/10 bg-gray-900/50 p-3 text-left text-xs text-red-300">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
          >
            <RotateCcw className="h-4 w-4" />
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

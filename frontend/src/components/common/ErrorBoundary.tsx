import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    console.error('Route rendering error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card max-w-md mx-auto my-12 text-center space-y-3">
          <h2 className="m-0">Unable to load this view</h2>
          <p className="sub text-sm m-0">
            A network or rendering error occurred. Reload to try again.
          </p>
          <button
            type="button"
            className="btn"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

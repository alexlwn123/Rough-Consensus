import { Component, type ErrorInfo, type ReactNode } from "react";
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Application failed to load", error, info.componentStack);
  }
  render() {
    if (this.state.failed)
      return (
        <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
          <h1 className="text-2xl font-semibold">We couldn’t load this page</h1>
          <p>Please check your connection and try again.</p>
          <button
            className="rounded bg-blue-700 px-4 py-2 text-white"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
          <a className="text-blue-700 underline" href="/">
            Return home
          </a>
        </main>
      );
    return this.props.children;
  }
}

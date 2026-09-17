import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("Application render error:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-5">
        <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-500 mb-2">Something went wrong</p>
          <h1 className="text-xl font-semibold text-gray-900">This page could not be displayed.</h1>
          <p className="text-sm text-gray-500 mt-2">Reload the page. If the problem continues, check the browser console and backend terminal.</p>
          {import.meta.env.DEV && this.state.error?.message && (
            <pre className="mt-4 overflow-auto rounded-xl bg-gray-950 p-3 text-xs text-gray-100">{this.state.error.message}</pre>
          )}
          <button onClick={() => window.location.reload()} className="mt-5 w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800">Reload page</button>
        </div>
      </div>
    );
  }
}

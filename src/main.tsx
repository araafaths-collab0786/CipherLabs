import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class StartupErrorBoundary extends React.Component<
  React.PropsWithChildren,
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Cipher Labs failed to render:', error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#F3F6F8] p-6 text-slate-900">
          <section className="max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
            <h1 className="text-xl font-semibold">Cipher Labs could not start</h1>
            <p className="mt-3 text-sm text-slate-600">
              The app hit an unexpected error while loading. Reload the app to try again.
            </p>
            <details className="mt-4 text-left text-xs text-slate-500">
              <summary className="cursor-pointer">Technical details</summary>
              <code className="mt-2 block break-words">{this.state.error.message}</code>
            </details>
            <button
              className="mt-6 rounded-lg bg-cyan-600 px-5 py-2.5 font-medium text-white hover:bg-cyan-700"
              onClick={() => window.location.reload()}
            >
              Reload app
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StartupErrorBoundary>
    <App />
  </StartupErrorBoundary>
);

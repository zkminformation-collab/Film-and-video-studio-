import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
  isQuotaError: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
      isQuotaError: false,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const raw = error?.message || 'Unexpected application error';
    const isQuota =
      raw.includes('Quota exceeded') ||
      raw.includes('resource-exhausted') ||
      raw.includes('Free daily read units');
    return {
      hasError: true,
      errorMessage: raw,
      isQuotaError: isQuota,
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Studio ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      let parsedReason = this.state.errorMessage;
      try {
        const parsed = JSON.parse(this.state.errorMessage);
        if (parsed?.error) {
          parsedReason = `${parsed.operationType?.toUpperCase() || 'OP'} (${parsed.path || 'unknown'}): ${parsed.error}`;
        }
      } catch {
        // Use raw message
      }

      return (
        <div className="min-h-screen w-screen bg-[#090b11] text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-[#0d111c] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h2 className="text-base font-bold text-white">
                {this.state.isQuotaError ? 'Firestore Daily Quota Reached' : 'Studio Workspace Notice'}
              </h2>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed break-words">
              {this.state.isQuotaError
                ? 'The free daily Firestore read/write limit has been reached. Quota resets tomorrow, or you can upgrade the database plan in the Firebase Console.'
                : parsedReason}
            </p>

            <button
              type="button"
              onClick={() => this.setState({ hasError: false, errorMessage: '', isQuotaError: false })}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Recover Workspace</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

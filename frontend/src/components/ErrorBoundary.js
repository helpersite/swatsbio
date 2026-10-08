import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="w-full min-h-[300px] p-6 sm:p-8 rounded-2xl bg-[#0c0e15] border border-red-500/20 flex flex-col items-center justify-center text-center my-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4">
            <AlertTriangle size={24} />
          </div>
          <h2 className="text-lg font-bold text-white font-display mb-1">
            Component Rendering Error
          </h2>
          <p className="text-xs text-[#E5E7EB]/60 max-w-md mb-6 leading-relaxed">
            A display issue occurred while rendering this section. You can reload this view or navigate back to the overview.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl bg-[#5B8DB8] hover:bg-[#4A7A9F] text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-[#5B8DB8]/20"
            >
              <RefreshCw size={14} />
              <span>Retry Component</span>
            </button>
            <a
              href="/dashboard/home"
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#E5E7EB] text-xs font-semibold flex items-center gap-2 transition-all border border-white/10"
            >
              <Home size={14} />
              <span>Overview</span>
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

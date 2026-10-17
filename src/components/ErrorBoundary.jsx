import React from 'react';
import { AlertTriangle, RotateCcw, Home, Sparkles } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled render error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetAndGoSales = () => {
    try {
      localStorage.setItem('activeTab', 'sales');
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-white">Kuch Gadbad Hui (Auto-Recovery Ready)</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Aapka cafe data surakshit hai. Niche diye button se page reload karein ya seedha POS counter par jayein.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-left text-[11px] font-mono text-rose-300 overflow-x-auto max-h-28">
                {String(this.state.error.message || this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Page Reload Karein</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetAndGoSales}
                className="py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                <span>POS Counter Par Jayein</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

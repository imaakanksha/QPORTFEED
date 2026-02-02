import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };
  
  // Explicitly declare props to ensure TypeScript recognizes the inherited property
  public declare props: Readonly<Props>;

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Critical System Failure:", error, errorInfo);
    // In a real app, log to Google Analytics/Crashlytics here
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen w-screen bg-zinc-950 text-red-600 font-mono overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
          <div className="z-10 text-center space-y-6 p-8 border border-red-900/50 bg-black/50 backdrop-blur-xl rounded-3xl shadow-2xl">
            <div className="w-16 h-16 mx-auto border-4 border-red-600 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-4xl font-black">!</span>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-white">System Critical Error</h1>
            <p className="text-xs uppercase tracking-[0.2em] text-red-400 max-w-md">
              Runtime exception detected in core render loop. Safety protocols engaged.
            </p>
            <div className="bg-zinc-900/80 p-4 rounded-lg text-left overflow-auto max-h-32 max-w-lg border border-red-900/30">
              <code className="text-[10px] text-zinc-500">{this.state.error?.message}</code>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl uppercase tracking-widest text-xs transition-all active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
            >
              Initiate Hard Reboot
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

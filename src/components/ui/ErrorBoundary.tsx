import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error atrapado en ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center rounded-3xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 max-w-lg mx-auto my-8">
          <div className="p-3.5 mb-3 rounded-2xl bg-white dark:bg-slate-900 text-rose-500 shadow-sm border border-rose-100 dark:border-rose-900/50">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {this.props.fallbackTitle || 'Ocurrió un error en esta herramienta'}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-sm">
            {this.state.error?.message || 'Hubo un fallo inesperado al procesar la operación.'}
          </p>
          <div className="mt-5">
            <Button
              variant="secondary"
              size="sm"
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={this.handleReset}
            >
              Reintentar herramienta
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Poupagaio ErrorBoundary Caught]', error, errorInfo);
  }

  private handleReload = () => {
    (this as any).setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  public render() {
    if ((this as any).state.hasError) {
      return (
        <div className="min-h-screen bg-[#F6FAF7] flex items-center justify-center p-4 selection:bg-[#22C55E] selection:text-white">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-[#DDE8E0] p-8 text-center space-y-6">
            <div className="mx-auto w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-red-600 shadow-xs">
              <AlertTriangle size={28} />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-[#0D3B22]">
                {(this as any).props.fallbackTitle || 'Não foi possível carregar esta tela.'}
              </h2>
              <p className="text-xs text-[#68736C] leading-relaxed">
                Ocorreu um erro inesperado ao exibir este conteúdo. Nossos servidores foram notificados e o problema está sendo investigado.
              </p>
            </div>

            <button
              onClick={this.handleReload}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold text-sm rounded-xl shadow-xs transition-all active:scale-[0.99] min-h-[44px]"
            >
              <RefreshCw size={17} />
              <span>Tentar novamente</span>
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

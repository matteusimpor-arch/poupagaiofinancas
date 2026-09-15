import React, { useState } from 'react';
import { Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { PoupagaioLogo } from '../common/PoupagaioLogo';
import {
  checkLoginAttempts,
  isValidEmailFormat,
  signInPasswordless,
} from '../../lib/supabase';

interface LoginScreenProps {
  onSwitchToRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const targetEmail = email.trim().toLowerCase();

    if (!targetEmail) {
      setError('Por favor, informe seu e-mail.');
      return;
    }

    if (!isValidEmailFormat(targetEmail)) {
      setError('Por favor, informe um e-mail válido.');
      return;
    }

    // Verificação de bloqueio por excesso de tentativas (Seção 2)
    const attemptCheck = checkLoginAttempts(targetEmail);
    if (attemptCheck.isBlocked) {
      setError('Muitas tentativas. Aguarde alguns minutos e tente novamente.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signInPasswordless(targetEmail);

      if (!res.success) {
        setError(res.error || 'Não foi possível enviar o e-mail de acesso.');
        setIsLoading(false);
        return;
      }

      setIsSent(true);
    } catch (err) {
      // Mensagem neutra em caso de exceção de segurança (Seção 22)
      setIsSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="login-screen"
      className="min-h-screen bg-[#F6FAF7] flex flex-col items-center justify-center p-4 selection:bg-[#22C55E] selection:text-white"
    >
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#DDE8E0] p-7 md:p-8 space-y-6">
        {/* Logo Centralizada e Slogan */}
        <div className="flex flex-col items-center text-center space-y-2">
          <PoupagaioLogo size="lg" showSlogan={true} />
          <p className="text-xs text-[#68736C] pt-2 max-w-xs">
            Organize hoje. Voe mais longe.
          </p>
        </div>

        {isSent ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto w-12 h-12 bg-emerald-50 text-[#22C55E] rounded-full flex items-center justify-center border border-[#22C55E]/30 shadow-xs">
              <CheckCircle2 size={24} />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-[#0D3B22]">Link de acesso enviado!</h3>
              <p className="text-xs text-[#68736C] leading-relaxed">
                Enviamos um link de login para <span className="font-semibold text-[#0D3B22]">{email}</span>. Acesse seu e-mail e clique no botão para entrar.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsSent(false);
                setEmail('');
              }}
              className="text-xs font-bold text-[#22C55E] hover:underline"
            >
              Voltar para Entrar
            </button>
          </div>
        ) : (
          <>
            {/* Abas Alternadoras Entrar / Cadastrar */}
            <div className="flex p-1 bg-[#F6FAF7] border border-[#DDE8E0] rounded-2xl">
              <button
                type="button"
                id="tab-active-login"
                className="flex-1 py-2 text-xs font-bold rounded-xl transition-all bg-white text-[#0D3B22] shadow-2xs"
              >
                Entrar
              </button>
              <button
                type="button"
                id="tab-switch-to-register"
                onClick={onSwitchToRegister}
                className="flex-1 py-2 text-xs font-bold rounded-xl transition-all text-[#68736C] hover:text-[#18201B]"
              >
                Criar Conta
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* E-mail */}
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1.5"
                >
                  E-mail de Acesso
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#68736C]"
                  />
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] placeholder-[#68736C]/60 text-sm font-medium focus:ring-2 focus:ring-[#22C55E] focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>

              {/* Botão Entrar */}
              <button
                type="submit"
                id="btn-submit-login"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold text-sm rounded-xl shadow-xs transition-all active:scale-[0.99] focus:ring-2 focus:ring-[#22C55E] min-h-[44px]"
              >
                <span>{isLoading ? 'Enviando...' : 'Entrar sem Senha'}</span>
                <ArrowRight size={17} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Mail, Lock, ArrowRight, AlertCircle, RefreshCw, ChevronLeft } from 'lucide-react';
import { PoupagaioLogo } from '../common/PoupagaioLogo';
import { useFinance } from '../../context/FinanceContext';
import {
  isValidEmailFormat,
  loginUserWithSupabase,
  resendConfirmationEmail,
  sendPasswordResetEmail,
  checkLoginAttempts,
} from '../../lib/supabase';

interface LoginScreenProps {
  onSwitchToRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSwitchToRegister }) => {
  const { login } = useFinance();
  const [mode, setMode] = useState<'login' | 'forgot_password'>('login');
  
  // Estados de entrada
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Estados de controle
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showNeedsConfirmation, setShowNeedsConfirmation] = useState(false);
  
  // Cooldown de reenvio
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setShowNeedsConfirmation(false);

    const targetEmail = email.trim().toLowerCase();

    if (!targetEmail) {
      setError('Por favor, informe seu e-mail.');
      return;
    }

    if (!password) {
      setError('Por favor, informe sua senha.');
      return;
    }

    const check = checkLoginAttempts(targetEmail);
    if (check.isBlocked) {
      setError(`Muitas tentativas. Aguarde ${check.remainingMinutes || 10} minutos.`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginUserWithSupabase(targetEmail, password);

      if (!res.success) {
        if (res.needsEmailConfirmation) {
          setShowNeedsConfirmation(true);
          setError('Sua conta precisa de confirmação de e-mail. Por favor, confirme seu e-mail antes de entrar.');
        } else {
          setError(res.error || 'E-mail ou senha incorretos.');
        }
        setIsLoading(false);
        return;
      }

      // Conectado com sucesso -> atualizar contexto local
      const isSynced = await login(targetEmail, password, res.user);
      if (!isSynced) {
        setError('Sincronização de perfil falhou. Tente novamente.');
      }
    } catch (err: any) {
      setError(err.message || 'Falha na autenticação.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    const targetEmail = email.trim().toLowerCase();

    if (!targetEmail) {
      setError('Por favor, informe seu e-mail para enviar as instruções.');
      return;
    }

    if (!isValidEmailFormat(targetEmail)) {
      setError('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await sendPasswordResetEmail(targetEmail);
      if (res.success) {
        setInfoMessage(res.message || 'E-mail de redefinição enviado com sucesso!');
        setCooldown(60);
      } else {
        setError(res.error || 'Falha ao enviar e-mail de recuperação.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao redefinir senha.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setError(null);
    setInfoMessage(null);
    const targetEmail = email.trim().toLowerCase();

    if (!targetEmail) {
      setError('Por favor, digite seu e-mail para enviar a confirmação.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await resendConfirmationEmail(targetEmail);
      if (res.success) {
        setInfoMessage('Novo link de confirmação enviado para seu e-mail.');
        setCooldown(60);
      } else {
        setError(res.error || 'Erro ao reenviar confirmação.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro de rede.');
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
        {/* Logo Centralizada */}
        <div className="flex flex-col items-center text-center space-y-1">
          <PoupagaioLogo size="lg" showSlogan={true} />
        </div>

        {mode === 'login' ? (
          <div className="space-y-6">
            <div className="space-y-1 text-center">
              <h3 className="text-xl font-bold text-[#0D3B22]">Bem-vindo de volta</h3>
            </div>

            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <span>{error}</span>
                  {showNeedsConfirmation && (
                    <button
                      type="button"
                      disabled={cooldown > 0 || isLoading}
                      onClick={handleResendConfirmation}
                      className="block text-xs font-bold text-red-800 hover:text-red-950 underline disabled:opacity-50"
                    >
                      {cooldown > 0 ? `Reenviar confirmação em ${cooldown}s` : 'Clique aqui para Reenviar Confirmação'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {infoMessage && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs font-semibold text-green-700">
                {infoMessage}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              {/* E-mail */}
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1.5"
                >
                  E-mail
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

              {/* Senha */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide"
                  >
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot_password');
                      setError(null);
                      setInfoMessage(null);
                    }}
                    className="text-xs font-bold text-[#22C55E] hover:text-[#16a34a] hover:underline"
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#68736C]"
                  />
                  <input
                    id="login-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] placeholder-[#68736C]/60 text-sm font-medium focus:ring-2 focus:ring-[#22C55E] focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>

              {/* Botão Entrar */}
              <button
                type="submit"
                id="btn-submit-login"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold text-sm rounded-xl shadow-xs transition-all active:scale-[0.99] focus:ring-2 focus:ring-[#22C55E] min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span>{isLoading ? 'Entrando...' : 'Entrar'}</span>
                <ArrowRight size={17} />
              </button>
            </form>

            <div className="flex flex-col items-center gap-2 pt-4 border-t border-[#DDE8E0]/40 text-center">
              <span className="text-xs text-[#68736C]">Primeira vez?</span>
              <button
                type="button"
                id="btn-switch-to-register"
                onClick={onSwitchToRegister}
                className="text-xs font-bold text-[#22C55E] hover:text-[#16a34a] hover:underline transition-all"
              >
                Criar minha conta
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setInfoMessage(null);
                }}
                className="p-1 hover:bg-[#F6FAF7] rounded-lg text-[#68736C] hover:text-[#18201B] transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <h3 className="text-lg font-bold text-[#0D3B22]">Recuperar senha</h3>
            </div>

            <p className="text-xs text-[#68736C] leading-relaxed">
              Informe seu e-mail cadastrado para enviarmos as instruções de redefinição de senha.
            </p>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {infoMessage && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs font-semibold text-green-700">
                {infoMessage}
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-5">
              {/* E-mail */}
              <div>
                <label
                  htmlFor="forgot-email"
                  className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1.5"
                >
                  E-mail
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#68736C]"
                  />
                  <input
                    id="forgot-email"
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

              {/* Botão Recuperar */}
              <button
                type="submit"
                disabled={isLoading || cooldown > 0}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold text-sm rounded-xl shadow-xs transition-all active:scale-[0.99] focus:ring-2 focus:ring-[#22C55E] min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span>
                  {isLoading
                    ? 'Enviando...'
                    : cooldown > 0
                    ? `Reenviar em ${cooldown}s`
                    : 'Enviar e-mail de recuperação'}
                </span>
                <ArrowRight size={17} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

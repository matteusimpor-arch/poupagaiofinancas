import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { PoupagaioLogo } from '../common/PoupagaioLogo';
import {
  checkLoginAttempts,
  isValidEmailFormat,
  loginUserWithSupabase,
  resendConfirmationEmail,
} from '../../lib/supabase';

interface LoginScreenProps {
  onSwitchToRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSwitchToRegister }) => {
  const { login, loginWithGoogle } = useFinance();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Esqueci minha senha (Seção 1.6)
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      const ok = await loginWithGoogle();
      if (!ok) {
        setError('Não foi possível autenticar com o Google.');
      }
    } catch (err) {
      setError('Erro ao conectar ao Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1.5 Verificação de bloqueio por excesso de tentativas
    const attemptCheck = checkLoginAttempts(email);
    if (attemptCheck.isBlocked) {
      setError('Muitas tentativas. Aguarde alguns minutos e tente novamente.');
      return;
    }

    if (!isValidEmailFormat(email)) {
      setError('E-mail ou senha incorretos.');
      return;
    }

    if (password.length < 8) {
      setError('E-mail ou senha incorretos.');
      return;
    }

    setIsLoading(true);
    try {
      // Tenta login com verificação de segurança Supabase/Local
      const res = await loginUserWithSupabase(email, password);

      if (!res.success) {
        setError(res.error || 'E-mail ou senha incorretos.');
        setIsLoading(false);
        return;
      }

      // Conclui login no FinanceContext
      await login(email, password);
    } catch (err) {
      setError('E-mail ou senha incorretos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isValidEmailFormat(forgotEmail)) {
      setError('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    setForgotLoading(true);
    try {
      await resendConfirmationEmail(forgotEmail);
      setForgotSent(true);
    } catch (e) {
      setForgotSent(true);
    } finally {
      setForgotLoading(false);
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

        {showForgot ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#0D3B22]">Recuperação de Senha</h3>
              <p className="text-xs text-[#68736C] leading-relaxed">
                Informe seu e-mail cadastrado e enviaremos um link seguro para redefinição.
              </p>
            </div>

            {forgotSent ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-800 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-[#22C55E]" />
                  <span>Link enviado com sucesso!</span>
                </div>
                <p className="text-[11px] text-[#68736C] font-normal">
                  Verifique sua caixa de entrada e a pasta de spam.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-[#0D3B22] uppercase mb-1">
                  E-mail
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#68736C]"
                  />
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DDE8E0] text-sm font-medium focus:ring-2 focus:ring-[#22C55E] focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowForgot(false);
                  setForgotSent(false);
                }}
                className="text-xs font-bold text-[#68736C] hover:underline"
              >
                Voltar ao login
              </button>
              {!forgotSent && (
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="py-2 px-4 bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                >
                  {forgotLoading ? 'Enviando...' : 'Enviar Link'}
                </button>
              )}
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* E-mail */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1"
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
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] placeholder-[#68736C]/60 text-sm font-medium focus:ring-2 focus:ring-[#22C55E] focus:outline-none"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="login-password"
                  className="text-xs font-bold text-[#0D3B22] uppercase tracking-wide"
                >
                  Senha
                </label>
                <button
                  type="button"
                  id="btn-forgot-password"
                  onClick={() => {
                    setForgotEmail(email);
                    setShowForgot(true);
                  }}
                  className="text-xs text-[#22C55E] hover:underline font-semibold"
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
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha (mínimo 8 caracteres)"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] placeholder-[#68736C]/60 text-sm font-medium focus:ring-2 focus:ring-[#22C55E] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#68736C] hover:text-[#18201B]"
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Botão Entrar */}
            <button
              type="submit"
              id="btn-submit-login"
              disabled={isLoading || isGoogleLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold text-sm rounded-xl shadow-xs transition-all active:scale-[0.99] focus:ring-2 focus:ring-[#22C55E]"
            >
              <span>{isLoading ? 'Entrando...' : 'Entrar no Poupagaio'}</span>
              <ArrowRight size={17} />
            </button>

            {/* Divisor */}
            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-[#DDE8E0] w-full" />
              <span className="bg-white px-3 text-[11px] font-bold text-[#68736C] uppercase tracking-wider">
                ou
              </span>
              <div className="border-t border-[#DDE8E0] w-full" />
            </div>

            {/* Botão Google */}
            <button
              type="button"
              id="btn-google-login"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isLoading}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white hover:bg-[#F6FAF7] border border-[#DDE8E0] text-[#18201B] font-bold text-xs rounded-xl shadow-xs transition-all active:scale-[0.99]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isGoogleLoading ? 'Conectando...' : 'Entrar com Google'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { PoupagaioLogo } from '../common/PoupagaioLogo';
import {
  checkLoginAttempts,
  isValidEmailFormat,
  loginUserWithSupabase,
  sendPasswordResetEmail,
} from '../../lib/supabase';

interface LoginScreenProps {
  onSwitchToRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSwitchToRegister }) => {
  const { login } = useFinance();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Esqueci minha senha (Seção 1.6)
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1.5 Verificação de bloqueio por excesso de tentativas
    const attemptCheck = checkLoginAttempts(email);
    if (attemptCheck.isBlocked) {
      setError('Muitas tentativas. Aguarde alguns minutos e tente novamente.');
      return;
    }

    if (!email.trim()) {
      setError('Por favor, informe seu e-mail.');
      return;
    }

    if (!password) {
      setError('Por favor, informe sua senha.');
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

      // Conclui login no FinanceContext mantendo o auth.uid() do usuário
      await login(email, password, res.user);
    } catch (err) {
      setError('E-mail ou senha incorretos.');
    } finally {
      setIsLoading(false);
    }
  };

  const [forgotMessage, setForgotMessage] = useState<string>('');

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isValidEmailFormat(forgotEmail)) {
      setError('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await sendPasswordResetEmail(forgotEmail);
      setForgotMessage(res.message);
      setForgotSent(true);
    } catch (e) {
      setForgotMessage('Se existir uma conta associada a esse e-mail, enviaremos as instruções para redefinir a senha.');
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
                  <CheckCircle2 size={18} className="text-[#22C55E] shrink-0" />
                  <span>Solicitação recebida</span>
                </div>
                <p className="text-[12px] text-[#0D3B22] font-normal leading-relaxed">
                  {forgotMessage || 'Se existir uma conta associada a esse e-mail, enviaremos as instruções para redefinir a senha.'}
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
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold text-sm rounded-xl shadow-xs transition-all active:scale-[0.99] focus:ring-2 focus:ring-[#22C55E]"
            >
              <span>{isLoading ? 'Entrando...' : 'Entrar no Poupagaio'}</span>
              <ArrowRight size={17} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, CheckCircle2, RotateCcw } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { PoupagaioLogo } from '../common/PoupagaioLogo';
import {
  isValidEmailFormat,
  registerUserWithSupabase,
  resendConfirmationEmail,
  simulateConfirmEmail,
} from '../../lib/supabase';

interface RegisterScreenProps {
  onSwitchToLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onSwitchToLogin }) => {
  const { signup, loginWithGoogle } = useFinance();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const phone = '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Estado de confirmação obrigatória de e-mail (Seção 1.3)
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendFeedback, setResendFeedback] = useState<string | null>(null);

  // Contador de cooldown para reenvio de e-mail (60s)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleGoogleSignup = async () => {
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

    // 1.1 e 1.2 Validações
    if (!name.trim()) {
      setError('Informe seu nome completo.');
      return;
    }

    if (!isValidEmailFormat(email)) {
      setError('Por favor, informe um endereço de e-mail válido (ex: seuemail@exemplo.com).');
      return;
    }

    if (password.length < 8) {
      setError('A senha deve possuir no mínimo 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas digitadas não coincidem. Verifique e tente novamente.');
      return;
    }

    setIsLoading(true);
    try {
      // Registra via módulo Supabase / Local seguro
      const res = await registerUserWithSupabase({
        name,
        email,
        phone,
        password,
      });

      if (!res.success) {
        setError(res.error || 'Não foi possível criar sua conta. Verifique os dados.');
        setIsLoading(false);
        return;
      }

      // Se requer confirmação obrigatória de e-mail (Seção 1.3)
      if (res.needsEmailConfirmation) {
        setRegisteredEmail(email.trim().toLowerCase());
        setAwaitingConfirmation(true);
        setResendCooldown(60);
      } else {
        // Se já confirmou ou autenticado direto
        await signup(name, email, password, phone);
      }
    } catch (err) {
      setError('Erro ao cadastrar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (resendCooldown > 0) return;
    setResendFeedback(null);
    const res = await resendConfirmationEmail(registeredEmail);
    if (res.success) {
      setResendFeedback('Novo link de confirmação enviado com sucesso!');
      setResendCooldown(60);
    } else {
      setResendFeedback(res.error || 'Erro ao reenviar link. Tente novamente.');
    }
  };

  const handleSimulateConfirmation = async () => {
    simulateConfirmEmail(registeredEmail);
    await signup(name, registeredEmail, password, phone);
  };

  // TELA DE CONFIRMAÇÃO DE E-MAIL (Seção 1.3)
  if (awaitingConfirmation) {
    return (
      <div
        id="email-confirmation-screen"
        className="min-h-screen bg-[#F6FAF7] flex flex-col items-center justify-center p-4 selection:bg-[#22C55E] selection:text-white"
      >
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#DDE8E0] p-7 md:p-8 space-y-6 text-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-[#22C55E] flex items-center justify-center shadow-inner">
              <Mail size={32} />
            </div>
            <h2 className="text-xl font-black text-[#0D3B22]">Confirme seu e-mail</h2>
            <p className="text-xs text-[#68736C] leading-relaxed max-w-sm">
              Enviamos um link de confirmação para o endereço:
              <br />
              <strong className="text-[#18201B] font-bold text-sm">{registeredEmail}</strong>
            </p>
            <div className="p-3 bg-[#F6FAF7] border border-[#DDE8E0] rounded-xl text-xs text-[#0D3B22] font-medium">
              Abra seu e-mail e confirme sua conta para continuar.
            </div>
          </div>

          {resendFeedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center justify-center gap-2">
              <CheckCircle2 size={16} />
              <span>{resendFeedback}</span>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              type="button"
              id="btn-resend-email"
              onClick={handleResendConfirmation}
              disabled={resendCooldown > 0}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-2 ${
                resendCooldown > 0
                  ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-[#0D3B22] border-[#DDE8E0] hover:bg-[#F6FAF7]'
              }`}
            >
              <RotateCcw size={14} className={resendCooldown > 0 ? '' : 'text-[#22C55E]'} />
              <span>
                {resendCooldown > 0
                  ? `Reenviar e-mail em ${resendCooldown}s`
                  : 'Reenviar e-mail de confirmação'}
              </span>
            </button>

            {/* Simulação ou Acesso */}
            <button
              type="button"
              id="btn-confirm-and-enter"
              onClick={handleSimulateConfirmation}
              className="w-full py-3 px-4 bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold text-sm rounded-xl shadow-xs transition-transform active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>Já confirmei meu e-mail</span>
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="pt-2 border-t border-[#DDE8E0]/70">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-xs font-bold text-[#68736C] hover:text-[#18201B]"
            >
              ← Voltar para o login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="register-screen"
      className="min-h-screen bg-[#F6FAF7] flex flex-col items-center justify-center p-4 selection:bg-[#22C55E] selection:text-white"
    >
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#DDE8E0] p-7 md:p-8 space-y-5">
        <div className="flex flex-col items-center text-center space-y-2">
          <PoupagaioLogo size="lg" showSlogan={true} />
          <h2 className="text-xl font-black text-[#0D3B22] pt-1">Crie sua conta no Poupagaio</h2>
          <p className="text-xs text-[#68736C] max-w-xs">
            Organize hoje. Voe mais longe. Sem dados bancários ou cartões.
          </p>
        </div>

        {/* Abas Alternadoras Entrar / Cadastrar */}
        <div className="flex p-1 bg-[#F6FAF7] border border-[#DDE8E0] rounded-2xl">
          <button
            type="button"
            id="tab-switch-to-login"
            onClick={onSwitchToLogin}
            className="flex-1 py-2 text-xs font-bold rounded-xl transition-all text-[#68736C] hover:text-[#18201B]"
          >
            Entrar
          </button>
          <button
            type="button"
            id="tab-active-register"
            className="flex-1 py-2 text-xs font-bold rounded-xl transition-all bg-white text-[#0D3B22] shadow-2xs"
          >
            Criar Conta
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* 1. Nome Completo */}
          <div>
            <label
              htmlFor="reg-name"
              className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1"
            >
              Seu Nome Completo <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#68736C]"
              />
              <input
                id="reg-name"
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Mateus Araujo"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] placeholder-[#68736C]/60 text-sm font-medium focus:ring-2 focus:ring-[#22C55E] focus:outline-none"
              />
            </div>
          </div>

          {/* 2. E-mail */}
          <div>
            <label
              htmlFor="reg-email"
              className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1"
            >
              E-mail <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#68736C]"
              />
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] placeholder-[#68736C]/60 text-sm font-medium focus:ring-2 focus:ring-[#22C55E] focus:outline-none"
              />
            </div>
          </div>

          {/* 3. Senha (Mínimo 8 caracteres) */}
          <div>
            <label
              htmlFor="reg-password"
              className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1"
            >
              Senha (mínimo 8 caracteres) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#68736C]"
              />
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Crie uma senha forte"
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

          {/* 5. Confirmar Senha */}
          <div>
            <label
              htmlFor="reg-confirm-password"
              className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1"
            >
              Confirmar Senha <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#68736C]"
              />
              <input
                id="reg-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita sua senha"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] placeholder-[#68736C]/60 text-sm font-medium focus:ring-2 focus:ring-[#22C55E] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#68736C] hover:text-[#18201B]"
                aria-label={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Exibir confirmação de senha'}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Botão de Cadastro */}
          <button
            type="submit"
            id="btn-submit-register"
            disabled={isLoading || isGoogleLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold text-sm rounded-xl shadow-xs transition-all active:scale-[0.99] focus:ring-2 focus:ring-[#22C55E] mt-2"
          >
            <span>{isLoading ? 'Criando sua conta...' : 'Cadastrar Gratuitamente'}</span>
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
            id="btn-google-register"
            onClick={handleGoogleSignup}
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
            <span>{isGoogleLoading ? 'Conectando...' : 'Cadastrar com Google'}</span>
          </button>
        </form>

        {/* Link para Login */}
        <div className="text-center pt-2 border-t border-[#DDE8E0]/70">
          <p className="text-xs text-[#68736C]">
            Já tem uma conta no Poupagaio?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-bold text-[#22C55E] hover:underline"
            >
              Fazer login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

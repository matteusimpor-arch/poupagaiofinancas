import React, { useState, useEffect, useRef } from 'react';
import { Mail, User, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import { PoupagaioLogo } from '../common/PoupagaioLogo';
import { useFinance } from '../../context/FinanceContext';
import {
  isValidEmailFormat,
  signUpPasswordless,
  verifyOtpCode,
} from '../../lib/supabase';

interface RegisterScreenProps {
  onSwitchToLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onSwitchToLogin }) => {
  const { signup } = useFinance();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Estados do OTP de 6 dígitos
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(''));
  const otpRefs = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const targetName = name.trim();
    const targetEmail = email.trim().toLowerCase();

    if (!targetName) {
      setError('Por favor, informe seu nome.');
      return;
    }

    if (!targetEmail) {
      setError('Por favor, informe seu e-mail.');
      return;
    }

    if (!isValidEmailFormat(targetEmail)) {
      setError('Por favor, informe um e-mail válido.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signUpPasswordless({
        name: targetName,
        email: targetEmail,
      });

      if (!res.success) {
        setError(res.error || 'Não foi possível enviar o código de confirmação. Tente novamente.');
        setIsLoading(false);
        return;
      }

      setIsOtpSent(true);
      setCooldown(60);
      setOtpValues(Array(6).fill(''));
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar cadastro.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const valClean = value.replace(/\D/g, '');
    if (!valClean) {
      const newOtpValues = [...otpValues];
      newOtpValues[index] = '';
      setOtpValues(newOtpValues);
      return;
    }

    const digit = valClean.substring(valClean.length - 1);
    const newOtpValues = [...otpValues];
    newOtpValues[index] = digit;
    setOtpValues(newOtpValues);

    if (index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpValues[index] && index > 0) {
        const newOtpValues = [...otpValues];
        newOtpValues[index - 1] = '';
        setOtpValues(newOtpValues);
        otpRefs.current[index - 1]?.focus();
      } else {
        const newOtpValues = [...otpValues];
        newOtpValues[index] = '';
        setOtpValues(newOtpValues);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (pastedText.length >= 6) {
      const digits = pastedText.substring(0, 6).split('');
      setOtpValues(digits);
      otpRefs.current[5]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const code = otpValues.join('');
    if (code.length < 6) {
      setError('Por favor, informe o código de 6 dígitos completo.');
      return;
    }

    setIsLoading(true);
    try {
      const verifyRes = await verifyOtpCode(email.trim().toLowerCase(), code, true);

      if (!verifyRes.success) {
        setError(verifyRes.error || 'Código de ativação incorreto ou expirado.');
        setIsLoading(false);
        return;
      }

      // Cria a conta do usuário com o perfil do contexto sincronizado no Supabase
      const isRegistered = await signup(name.trim(), email.trim().toLowerCase(), '', '', verifyRes.user);
      if (!isRegistered) {
        setError('Erro ao sincronizar e cadastrar perfil de usuário.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao verificar o código de ativação.');
    } finally {
      setIsLoading(false);
    }
  };

  const maskEmail = (emailStr: string): string => {
    const [local, domain] = emailStr.split('@');
    if (!local || !domain) return emailStr;
    if (local.length <= 2) {
      return `${local.charAt(0)}***@${domain}`;
    }
    return `${local.charAt(0)}***${local.charAt(local.length - 1)}@${domain}`;
  };

  return (
    <div
      id="register-screen"
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

        {isOtpSent ? (
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h3 className="text-lg font-bold text-[#0D3B22]">Confira seu e-mail</h3>
              <p className="text-xs text-[#68736C] leading-relaxed">
                Enviamos um código de 6 dígitos para:<br />
                <span className="font-bold text-[#0D3B22] text-sm">{maskEmail(email)}</span>
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {/* Entradas OTP de 6 dígitos */}
              <div className="flex justify-between gap-2 max-w-xs mx-auto">
                {otpValues.map((val, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpRefs.current[idx] = el as HTMLInputElement)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={val}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={idx === 0 ? handlePaste : undefined}
                    className="w-12 h-14 text-center text-xl font-bold rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] focus:ring-2 focus:ring-[#22C55E] focus:outline-none transition-all"
                  />
                ))}
              </div>

              {/* Botão de Confirmação */}
              <button
                type="submit"
                id="btn-verify-otp-register"
                disabled={isLoading || otpValues.some((v) => !v)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold text-sm rounded-xl shadow-xs transition-all active:scale-[0.99] focus:ring-2 focus:ring-[#22C55E] min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span>{isLoading ? 'Confirmando...' : 'Confirmar e entrar'}</span>
                <ArrowRight size={17} />
              </button>
            </form>

            <div className="flex flex-col items-center gap-3 pt-2 text-center">
              <span className="text-xs text-[#68736C]">Não recebeu o código?</span>
              <button
                type="button"
                disabled={cooldown > 0 || isLoading}
                onClick={handleRequestOtp}
                className="flex items-center gap-1.5 text-xs font-bold text-[#22C55E] hover:text-[#16a34a] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                <span>
                  {cooldown > 0 ? `Reenviar código em ${cooldown}s` : 'Reenviar código'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOtpSent(false);
                  setError(null);
                }}
                className="text-xs font-bold text-[#68736C] hover:text-[#18201B] hover:underline pt-2"
              >
                Alterar nome ou e-mail
              </button>
            </div>
          </div>
        ) : (
          <>
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

            <div className="space-y-1 text-center">
              <h3 className="text-lg font-bold text-[#0D3B22]">Crie sua conta</h3>
              <p className="text-xs text-[#68736C]">Insira seus dados para começar gratuitamente</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRequestOtp} className="space-y-5">
              {/* Nome */}
              <div>
                <label
                  htmlFor="register-name"
                  className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1.5"
                >
                  Nome Completo
                </label>
                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#68736C]"
                  />
                  <input
                    id="register-name"
                    type="text"
                    required
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] placeholder-[#68736C]/60 text-sm font-medium focus:ring-2 focus:ring-[#22C55E] focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>

              {/* E-mail */}
              <div>
                <label
                  htmlFor="register-email"
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
                    id="register-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] placeholder-[#68736C]/60 text-sm font-medium focus:ring-2 focus:ring-[#22C55E] focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>

              {/* Botão Cadastrar */}
              <button
                type="submit"
                id="btn-submit-register"
                disabled={isLoading || cooldown > 0}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold text-sm rounded-xl shadow-xs transition-all active:scale-[0.99] focus:ring-2 focus:ring-[#22C55E] min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span>
                  {isLoading
                    ? 'Enviando...'
                    : cooldown > 0
                    ? `Aguarde ${cooldown}s`
                    : 'Criar minha conta'}
                </span>
                <ArrowRight size={17} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

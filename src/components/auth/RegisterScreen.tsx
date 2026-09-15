import React, { useState } from 'react';
import { Mail, User, Phone, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { PoupagaioLogo } from '../common/PoupagaioLogo';
import {
  isValidEmailFormat,
  signUpPasswordless,
  resendConfirmationEmail,
} from '../../lib/supabase';

interface RegisterScreenProps {
  onSwitchToLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onSwitchToLogin }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPendingConfirmation, setIsPendingConfirmation] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Estados de reenvio de e-mail de confirmação
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.substring(0, 11);

    if (value.length > 10) {
      value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    } else if (value.length > 6) {
      value = value.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
    } else if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
    } else if (value.length > 0) {
      value = `(${value}`;
    }
    setPhone(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const fName = firstName.trim();
    const lName = lastName.trim();
    const targetEmail = email.trim().toLowerCase();

    if (!fName) {
      setError('Por favor, informe seu nome.');
      return;
    }

    if (!lName) {
      setError('Por favor, informe seu sobrenome.');
      return;
    }

    if (!isValidEmailFormat(targetEmail)) {
      setError('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signUpPasswordless({
        firstName: fName,
        lastName: lName,
        email: targetEmail,
        phone: phone || undefined,
      });

      if (!res.success) {
        setError(res.error || 'Não foi possível criar sua conta. Verifique os dados.');
        setIsLoading(false);
        return;
      }

      setIsPendingConfirmation(true);
      setCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendSuccess(null);
    setResendError(null);
    try {
      const res = await resendConfirmationEmail(email.trim().toLowerCase());
      if (res.success) {
        setResendSuccess('E-mail de ativação reenviado com sucesso! Verifique sua caixa de entrada.');
        setCooldown(60);
      } else {
        setResendError(res.error || 'Não foi possível reenviar o e-mail.');
      }
    } catch (err: any) {
      setResendError(err.message || 'Erro ao reenviar o e-mail.');
    } finally {
      setResendLoading(false);
    }
  };

  if (isPendingConfirmation) {
    return (
      <div
        id="register-success-screen"
        className="min-h-screen bg-[#F6FAF7] flex flex-col items-center justify-center p-4 selection:bg-[#22C55E] selection:text-white"
      >
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#DDE8E0] p-8 text-center space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center border border-[#22C55E]/20 text-[#22C55E]">
              <Mail size={32} />
            </div>
            <h2 className="text-xl font-black text-[#0D3B22]">Confirme seu E-mail!</h2>
            <p className="text-sm text-[#68736C]">
              Enviamos um link de ativação para <strong className="text-[#18201B]">{email}</strong>.
            </p>
            <p className="text-xs text-[#68736C] leading-relaxed max-w-xs bg-[#F6FAF7] p-3 rounded-xl border border-[#DDE8E0]/60">
              Por favor, clique no link contido no e-mail para ativar sua conta e iniciar sua experiência sem senha no Poupagaio.
            </p>
          </div>

          {(resendSuccess || resendError) && (
            <div className={`p-3.5 rounded-xl border text-xs text-center ${resendSuccess ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
              {resendSuccess && <p className="text-emerald-700 font-semibold">{resendSuccess}</p>}
              {resendError && <p className="text-red-600 font-semibold">{resendError}</p>}
            </div>
          )}

          <div className="space-y-2">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="w-full py-3 px-4 bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold text-sm rounded-xl shadow-xs transition-all active:scale-[0.99] min-h-[44px]"
            >
              Ir para Login
            </button>

            <button
              type="button"
              disabled={resendLoading || cooldown > 0}
              onClick={handleResend}
              className="w-full py-2.5 px-4 bg-transparent hover:bg-emerald-50/50 text-[#22C55E] font-bold text-xs rounded-xl border border-[#22C55E]/20 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed min-h-[42px]"
            >
              {resendLoading
                ? 'Reenviando...'
                : cooldown > 0
                ? `Reenviar em ${cooldown}s`
                : 'Reenviar E-mail de Confirmação'}
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
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Nome */}
          <div>
            <label
              htmlFor="reg-firstname"
              className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1"
            >
              Nome <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#68736C]"
              />
              <input
                id="reg-firstname"
                type="text"
                required
                autoFocus
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ex: Mateus"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] placeholder-[#68736C]/60 text-sm font-medium focus:ring-2 focus:ring-[#22C55E] focus:outline-none min-h-[44px]"
              />
            </div>
          </div>

          {/* Sobrenome */}
          <div>
            <label
              htmlFor="reg-lastname"
              className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1"
            >
              Sobrenome <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#68736C]"
              />
              <input
                id="reg-lastname"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ex: Araujo"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] placeholder-[#68736C]/60 text-sm font-medium focus:ring-2 focus:ring-[#22C55E] focus:outline-none min-h-[44px]"
              />
            </div>
          </div>

          {/* E-mail */}
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
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] placeholder-[#68736C]/60 text-sm font-medium focus:ring-2 focus:ring-[#22C55E] focus:outline-none min-h-[44px]"
              />
            </div>
          </div>

          {/* Telefone */}
          <div>
            <label
              htmlFor="reg-phone"
              className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1"
            >
              Telefone (Opcional)
            </label>
            <div className="relative">
              <Phone
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#68736C]"
              />
              <input
                id="reg-phone"
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="(11) 99999-9999"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] placeholder-[#68736C]/60 text-sm font-medium focus:ring-2 focus:ring-[#22C55E] focus:outline-none min-h-[44px]"
              />
            </div>
          </div>

          {/* Botão de Cadastro */}
          <button
            type="submit"
            id="btn-submit-register"
            disabled={isLoading || cooldown > 0}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold text-sm rounded-xl shadow-xs transition-all active:scale-[0.99] focus:ring-2 focus:ring-[#22C55E] mt-2 min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span>
              {isLoading
                ? 'Criando sua conta...'
                : cooldown > 0
                ? `Aguarde ${cooldown}s`
                : 'Cadastrar Gratuitamente'}
            </span>
            <ArrowRight size={17} />
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

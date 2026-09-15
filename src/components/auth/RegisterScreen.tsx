import React, { useState, useEffect } from 'react';
import { Mail, User, Lock, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import { PoupagaioLogo } from '../common/PoupagaioLogo';
import { useFinance } from '../../context/FinanceContext';
import {
  isValidEmailFormat,
  registerUserWithSupabase,
  resendConfirmationEmail,
  isSimulationActive,
} from '../../lib/supabase';

interface RegisterScreenProps {
  onSwitchToLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onSwitchToLogin }) => {
  const { signup } = useFinance();
  
  // Campos do formulário
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Estados de controle
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLinkSent, setIsLinkSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    const targetName = name.trim();
    const targetEmail = email.trim().toLowerCase();

    if (!targetName) {
      setError('Por favor, informe seu nome de usuário.');
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

    if (!password) {
      setError('Por favor, digite sua senha.');
      return;
    }

    if (password.length < 8) {
      setError('A senha deve possuir no mínimo 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    try {
      // Registra no Supabase (envia senha não modificada e sem trim)
      const res = await registerUserWithSupabase({
        name: targetName,
        email: targetEmail,
        password: password,
      });

      if (!res.success) {
        setError(res.error || 'Não foi possível realizar o cadastro. Tente novamente.');
        setIsLoading(false);
        return;
      }

      // De acordo com a seção 7, o e-mail de confirmação é obrigatório
      setIsLinkSent(true);
      setCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar cadastro.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setError(null);
    setInfoMessage(null);
    const targetEmail = email.trim().toLowerCase();

    if (!targetEmail) {
      setError('Por favor, informe o e-mail para reenvio.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await resendConfirmationEmail(targetEmail);
      if (res.success) {
        setInfoMessage('Novo link de confirmação enviado com sucesso!');
        setCooldown(60);
      } else {
        setError(res.error || 'Erro ao reenviar confirmação.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao comunicar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulateConfirmation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const targetEmail = email.trim().toLowerCase() || 'matteus.impor@gmail.com';
      const targetName = name.trim() || 'Usuário Teste';
      // Simula confirmação e loga o usuário localmente
      const isLogged = await signup(targetName, targetEmail, '', password, {
        id: 'user-simulated-' + Date.now(),
        email: targetEmail,
        full_name: targetName,
        created_at: new Date().toISOString(),
      });
      if (!isLogged) {
        setError('Erro ao criar perfil de simulação.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro na simulação.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="register-screen"
      className="min-h-screen bg-[#F6FAF7] flex flex-col items-center justify-center p-4 selection:bg-[#22C55E] selection:text-white"
    >
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#DDE8E0] p-7 md:p-8 space-y-6">
        {/* Logo Centralizada */}
        <div className="flex flex-col items-center text-center space-y-1">
          <PoupagaioLogo size="lg" showSlogan={true} />
        </div>

        {isLinkSent ? (
          <div className="space-y-6 text-center animate-fade-in">
            <div className="space-y-3">
              <div className="mx-auto w-12 h-12 bg-[#22C55E]/10 rounded-full flex items-center justify-center text-[#22C55E]">
                <Mail size={24} />
              </div>
              <h3 className="text-xl font-bold text-[#0D3B22]">📩 Confirme seu e-mail</h3>
              <p className="text-sm text-[#68736C] leading-relaxed">
                Sua conta foi criada.<br />
                Enviamos um link de confirmação para:<br />
                <span className="font-semibold text-[#0D3B22]">{email}</span>
              </p>
              <p className="text-xs text-[#68736C]">
                Abra o e-mail e confirme sua conta para começar a usar o Poupagaio.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-start gap-2 text-left">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {infoMessage && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs font-semibold text-green-700">
                {infoMessage}
              </div>
            )}

            {/* Simulação local para desenvolvedor / preview para não ficar travado no envio */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col gap-2 text-left">
              <span className="text-xs font-bold text-amber-900 block">Atalho de Homologação / Teste:</span>
              <span className="text-[11px] text-amber-800 leading-normal block">
                Se estiver testando localmente ou caso não queira esperar o e-mail real do Supabase, clique abaixo para confirmar a conta e logar imediatamente:
              </span>
              <button
                type="button"
                onClick={handleSimulateConfirmation}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all"
              >
                <span>{isLoading ? 'Confirmando...' : 'Confirmar e-mail e entrar agora'}</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="flex flex-col items-center gap-3 pt-2 text-center border-t border-[#DDE8E0]/40">
              <button
                type="button"
                disabled={cooldown > 0 || isLoading}
                onClick={handleResendConfirmation}
                className="flex items-center gap-1.5 text-xs font-bold text-[#22C55E] hover:text-[#16a34a] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                <span>
                  {cooldown > 0 ? `Reenviar confirmação em ${cooldown}s` : 'Reenviar confirmação'}
                </span>
              </button>

              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-xs font-bold text-[#68736C] hover:text-[#18201B] hover:underline pt-2"
              >
                Ir para a tela de Login
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-1 text-center">
              <h3 className="text-xl font-bold text-[#0D3B22]">Crie sua conta</h3>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              {/* Usuário (Nome) */}
              <div>
                <label
                  htmlFor="register-name"
                  className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1.5"
                >
                  Usuário
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
                    placeholder="Seu nome"
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

              {/* Senha */}
              <div>
                <label
                  htmlFor="register-password"
                  className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1.5"
                >
                  Senha
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#68736C]"
                  />
                  <input
                    id="register-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] placeholder-[#68736C]/60 text-sm font-medium focus:ring-2 focus:ring-[#22C55E] focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>

              {/* Confirmar senha */}
              <div>
                <label
                  htmlFor="register-confirm-password"
                  className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1.5"
                >
                  Confirmar senha
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#68736C]"
                  />
                  <input
                    id="register-confirm-password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita sua senha"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] placeholder-[#68736C]/60 text-sm font-medium focus:ring-2 focus:ring-[#22C55E] focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>

              {/* Botão Criar Conta */}
              <button
                type="submit"
                id="btn-submit-register"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold text-sm rounded-xl shadow-xs transition-all active:scale-[0.99] focus:ring-2 focus:ring-[#22C55E] min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span>{isLoading ? 'Cadastrando...' : 'Criar minha conta'}</span>
                <ArrowRight size={17} />
              </button>
            </form>

            <div className="flex flex-col items-center gap-2 pt-4 border-t border-[#DDE8E0]/40 text-center">
              <span className="text-xs text-[#68736C]">Já possui uma conta?</span>
              <button
                type="button"
                id="btn-switch-to-login"
                onClick={onSwitchToLogin}
                className="text-xs font-bold text-[#22C55E] hover:text-[#16a34a] hover:underline transition-all"
              >
                Entrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

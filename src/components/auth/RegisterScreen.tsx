import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { PoupagaioLogo } from '../common/PoupagaioLogo';
import {
  isValidEmailFormat,
  registerUserWithSupabase,
} from '../../lib/supabase';

interface RegisterScreenProps {
  onSwitchToLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onSwitchToLogin }) => {
  const { signup } = useFinance();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const phone = '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      // Registra no banco local / Supabase
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

      // Login imediato e simplificado utilizando o auth.uid() retornado
      await signup(name, email, password, phone, res.user);
    } catch (err) {
      setError('Erro ao cadastrar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

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
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold text-sm rounded-xl shadow-xs transition-all active:scale-[0.99] focus:ring-2 focus:ring-[#22C55E] mt-2"
          >
            <span>{isLoading ? 'Criando sua conta...' : 'Cadastrar Gratuitamente'}</span>
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

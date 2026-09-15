import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';
import { PoupagaioLogo } from '../common/PoupagaioLogo';
import { updateUserPassword } from '../../lib/supabase';

interface ResetPasswordScreenProps {
  onComplete: () => void;
  userEmail?: string;
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ onComplete, userEmail }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('A nova senha deve possuir no mínimo 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas digitadas não coincidem. Verifique e tente novamente.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await updateUserPassword(password, userEmail);
      if (res.success) {
        setIsSuccess(true);
      } else {
        setError(res.error || 'Erro ao alterar a senha. Tente novamente.');
      }
    } catch (err: any) {
      setError('Erro ao alterar a senha. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="reset-password-screen"
      className="min-h-screen bg-[#F6FAF7] flex flex-col items-center justify-center p-4 selection:bg-[#22C55E] selection:text-white"
    >
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#DDE8E0] p-7 md:p-8 space-y-6 text-center">
        <div className="flex flex-col items-center space-y-2">
          <PoupagaioLogo size="lg" showSlogan={true} />
          <h2 className="text-xl font-black text-[#0D3B22] pt-2">Redefinir senha</h2>
          <p className="text-xs text-[#68736C] max-w-xs">
            Crie uma nova senha segura para acessar seu Poupagaio.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-start gap-2 text-left">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="space-y-6 pt-2">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#22C55E] mx-auto flex items-center justify-center">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-base font-extrabold text-[#0D3B22]">Senha alterada com sucesso!</h3>
              <p className="text-xs text-[#68736C]">
                Sua senha foi redefinida com segurança. Agora você já pode acessar sua conta.
              </p>
            </div>

            <button
              type="button"
              id="btn-login-after-reset"
              onClick={onComplete}
              className="w-full py-3 px-4 bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <span>Entrar no Poupagaio</span>
              <ArrowRight size={17} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {/* Nova Senha */}
            <div>
              <label
                htmlFor="reset-new-password"
                className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1"
              >
                Nova senha (mínimo 8 caracteres) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#68736C]"
                />
                <input
                  id="reset-new-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua nova senha"
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

            {/* Confirmar Nova Senha */}
            <div>
              <label
                htmlFor="reset-confirm-password"
                className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1"
              >
                Confirmar nova senha <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#68736C]"
                />
                <input
                  id="reset-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] placeholder-[#68736C]/60 text-sm font-medium focus:ring-2 focus:ring-[#22C55E] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#68736C] hover:text-[#18201B]"
                  aria-label={showConfirmPassword ? 'Ocultar confirmação' : 'Exibir confirmação'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="btn-save-new-password"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold text-sm rounded-xl shadow-xs transition-all active:scale-[0.99] mt-2"
            >
              <span>{isLoading ? 'Salvando...' : 'Salvar nova senha'}</span>
              <ArrowRight size={17} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

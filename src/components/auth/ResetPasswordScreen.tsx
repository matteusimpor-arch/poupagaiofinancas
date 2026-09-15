import React, { useState } from 'react';
import { Lock, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { PoupagaioLogo } from '../common/PoupagaioLogo';
import { updateUserPassword } from '../../lib/supabase';

interface ResetPasswordScreenProps {
  userEmail?: string;
  onComplete: () => void;
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({
  userEmail,
  onComplete,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError('Por favor, digite sua nova senha.');
      return;
    }

    if (password.length < 8) {
      setError('A nova senha deve possuir no mínimo 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await updateUserPassword(password, userEmail);
      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.error || 'Não foi possível redefinir sua senha. Verifique o link e tente novamente.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar senha.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="reset-password-screen"
      className="min-h-screen bg-[#F6FAF7] flex flex-col items-center justify-center p-4 selection:bg-[#22C55E] selection:text-white"
    >
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#DDE8E0] p-7 md:p-8 space-y-6">
        {/* Logo Centralizada */}
        <div className="flex flex-col items-center text-center space-y-1">
          <PoupagaioLogo size="lg" showSlogan={true} />
        </div>

        {success ? (
          <div className="space-y-6 text-center animate-fade-in">
            <div className="space-y-3">
              <div className="mx-auto w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                <CheckCircle size={24} />
              </div>
              <h3 className="text-xl font-bold text-[#0D3B22]">🎉 Senha redefinida!</h3>
              <p className="text-sm text-[#68736C] leading-relaxed">
                Sua senha foi atualizada com sucesso. Agora você já pode entrar no Poupagaio com sua nova credencial.
              </p>
            </div>

            <button
              type="button"
              onClick={onComplete}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold text-sm rounded-xl shadow-xs transition-all"
            >
              <span>Ir para a tela de Login</span>
              <ArrowRight size={17} />
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-1 text-center">
              <h3 className="text-xl font-bold text-[#0D3B22]">Redefinir sua senha</h3>
              <p className="text-xs text-[#68736C]">Escolha uma nova senha forte com pelo menos 8 caracteres.</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Nova Senha */}
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1.5"
                >
                  Nova senha
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#68736C]"
                  />
                  <input
                    id="new-password"
                    type="password"
                    required
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] placeholder-[#68736C]/60 text-sm font-medium focus:ring-2 focus:ring-[#22C55E] focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>

              {/* Confirmar Nova Senha */}
              <div>
                <label
                  htmlFor="confirm-new-password"
                  className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wide mb-1.5"
                >
                  Confirmar nova senha
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#68736C]"
                  />
                  <input
                    id="confirm-new-password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita sua nova senha"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DDE8E0] bg-white text-[#18201B] placeholder-[#68736C]/60 text-sm font-medium focus:ring-2 focus:ring-[#22C55E] focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>

              {/* Botão Redefinir */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold text-sm rounded-xl shadow-xs transition-all active:scale-[0.99] focus:ring-2 focus:ring-[#22C55E] min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span>{isLoading ? 'Redefinindo...' : 'Redefinir senha'}</span>
                <ArrowRight size={17} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

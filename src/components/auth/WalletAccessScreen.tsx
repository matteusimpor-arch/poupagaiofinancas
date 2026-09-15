import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { PoupagaioLogo } from '../common/PoupagaioLogo';
import { ArrowRight } from 'lucide-react';

export const WalletAccessScreen: React.FC = () => {
  const { accessWallet } = useFinance();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      return;
    }
    setLoading(true);
    try {
      await accessWallet(name, email);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6FAF7] flex items-center justify-center p-4 selection:bg-[#22C55E] selection:text-white">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-[#DDE8E0] p-8 space-y-8 relative overflow-hidden">
        {/* Topo / Logo */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex justify-center">
            <PoupagaioLogo size="lg" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-[#0D3B22]">
              Bem-vindo!
            </h1>
            <p className="text-sm text-[#68736C]">
              Organize suas contas de um jeito simples.
            </p>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wider">
              Seu nome
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Mateus Silva"
              className="w-full px-4 py-3 bg-[#F6FAF7] border border-[#DDE8E0] rounded-xl text-sm text-[#0D3B22] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E] transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#0D3B22] uppercase tracking-wider">
              Seu e-mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mateus@email.com"
              className="w-full px-4 py-3 bg-[#F6FAF7] border border-[#DDE8E0] rounded-xl text-sm text-[#0D3B22] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-[0.99] disabled:opacity-50 min-h-[48px]"
          >
            <span>{loading ? 'Entrando...' : 'Entrar no Poupagaio'}</span>
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        {/* Rodapé informativo */}
        <div className="pt-4 border-t border-[#DDE8E0] text-center">
          <p className="text-[11px] text-[#68736C]">
            Acesso rápido, sem senhas ou complicações. Seus dados ficam salvos com segurança para quando você voltar.
          </p>
        </div>
      </div>
    </div>
  );
};

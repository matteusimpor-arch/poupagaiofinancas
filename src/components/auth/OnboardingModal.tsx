import React, { useState } from 'react';
import { Target, Users, User, ArrowRight, Sparkles, Plus, Compass } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { MascotMessage } from '../common/MascotMessage';

interface OnboardingModalProps {
  isOpen: boolean;
  onFinish: (openFirstTransactionModal: boolean) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onFinish }) => {
  const { completeOnboarding } = useFinance();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [goalType, setGoalType] = useState('Organizar minhas contas');
  const [usageType, setUsageType] = useState<'individual' | 'shared'>('shared');

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleFinish = (action: 'add_now' | 'explore') => {
    completeOnboarding(usageType);
    onFinish(action === 'add_now');
  };

  return (
    <div
      id="onboarding-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="onboarding-modal-content"
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#DDE8E0] overflow-hidden p-6 md:p-8 space-y-6"
      >
        {/* Header com Mascot Logo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo-poupagaio-principal.png"
              alt="Mascote Poupagaio"
              referrerPolicy="no-referrer"
              className="w-12 h-12 object-contain"
            />
            <div>
              <span className="text-[11px] font-bold text-[#22C55E] uppercase tracking-wider">
                Passo {step} de 3
              </span>
              <h3 className="text-lg font-black text-[#0D3B22]">Bem-vindo(a) ao Poupagaio!</h3>
            </div>
          </div>

          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  step === s ? 'bg-[#22C55E] w-6' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Passo 1: Qual o seu principal objetivo hoje? */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div>
              <h4 className="text-base font-bold text-[#18201B]">
                Qual o seu principal objetivo hoje?
              </h4>
              <p className="text-xs text-[#68736C] mt-1">
                Personalizaremos sua experiência com base no que for mais importante para você.
              </p>
            </div>

            <div className="space-y-2.5">
              {[
                {
                  id: 'Organizar minhas contas',
                  title: 'Organizar minhas contas',
                  desc: 'Saber para onde o dinheiro está indo e nunca mais atrasar boletos.',
                },
                {
                  id: 'Controlar os gastos do casal',
                  title: 'Controlar gastos em casal ou família',
                  desc: 'Ter transparência a dois sem atritos ou planilhas complicadas.',
                },
                {
                  id: 'Juntar dinheiro para um objetivo',
                  title: 'Juntar dinheiro para um objetivo',
                  desc: 'Criar reserva, viajar ou comprar algo especial com planejamento.',
                },
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setGoalType(opt.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    goalType === opt.id
                      ? 'bg-emerald-50 border-[#22C55E] ring-1 ring-[#22C55E]'
                      : 'bg-white border-[#DDE8E0] hover:bg-[#F6FAF7]'
                  }`}
                >
                  <h5 className="text-sm font-bold text-[#0D3B22]">{opt.title}</h5>
                  <p className="text-xs text-[#68736C] mt-0.5">{opt.desc}</p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="w-full py-3 bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all"
            >
              <span>Avançar</span>
              <ArrowRight size={17} />
            </button>
          </div>
        )}

        {/* Passo 2: Sozinho ou acompanhado? */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div>
              <h4 className="text-base font-bold text-[#18201B]">
                Você vai usar o Poupagaio sozinho(a) ou acompanhado(a)?
              </h4>
              <p className="text-xs text-[#68736C] mt-1">
                Você poderá criar novos espaços e convidar pessoas a qualquer momento.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setUsageType('individual')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  usageType === 'individual'
                    ? 'bg-emerald-50 border-[#22C55E] ring-1 ring-[#22C55E]'
                    : 'bg-white border-[#DDE8E0] hover:bg-[#F6FAF7]'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-[#68736C] mb-2">
                  <User size={20} />
                </div>
                <h5 className="text-sm font-bold text-[#0D3B22]">Individual</h5>
                <p className="text-xs text-[#68736C] mt-1 leading-snug">
                  Apenas eu. Minhas contas e objetivos totalmente privados.
                </p>
              </div>

              <div
                onClick={() => setUsageType('shared')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  usageType === 'shared'
                    ? 'bg-emerald-50 border-[#22C55E] ring-1 ring-[#22C55E]'
                    : 'bg-white border-[#DDE8E0] hover:bg-[#F6FAF7]'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-700 mb-2">
                  <Users size={20} />
                </div>
                <h5 className="text-sm font-bold text-[#0D3B22]">Compartilhado</h5>
                <p className="text-xs text-[#68736C] mt-1 leading-snug">
                  Com meu parceiro(a) ou família. Visão conjunta das contas de casa.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-semibold text-[#68736C] hover:text-[#18201B]"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="py-2.5 px-6 bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold text-sm rounded-xl shadow-xs flex items-center gap-2 transition-all"
              >
                <span>Avançar</span>
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        )}

        {/* Passo 3: Cadastrar primeiro lançamento ou explorar? */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div>
              <h4 className="text-base font-bold text-[#18201B]">
                Como você prefere começar hoje?
              </h4>
              <p className="text-xs text-[#68736C] mt-1">
                Tudo está pronto! Escolha por onde deseja dar o primeiro passo:
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleFinish('add_now')}
                className="w-full flex items-center gap-3.5 p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-[#22C55E] text-left transition-all group"
              >
                <div className="p-2.5 bg-[#22C55E] text-white rounded-xl shadow-xs group-hover:scale-105 transition-transform">
                  <Plus size={20} />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-[#0D3B22]">
                    Cadastrar meu primeiro lançamento agora
                  </h5>
                  <p className="text-xs text-[#68736C] mt-0.5">
                    Adicione um salário, aluguel, conta ou compra parcelada
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleFinish('explore')}
                className="w-full flex items-center gap-3.5 p-4 rounded-2xl bg-white hover:bg-[#F6FAF7] border border-[#DDE8E0] text-left transition-all"
              >
                <div className="p-2.5 bg-[#F6FAF7] text-[#0D3B22] rounded-xl border border-[#DDE8E0]">
                  <Compass size={20} />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-[#0D3B22]">
                    Explorar primeiro o aplicativo
                  </h5>
                  <p className="text-xs text-[#68736C] mt-0.5">
                    Conheça os gráficos, as metas e o painel inicial do Poupagaio
                  </p>
                </div>
              </button>
            </div>

            <MascotMessage
              message="Organize hoje. Voe mais longe. Estou aqui para te ajudar em cada conquista financeira!"
              mood="celebrate"
            />
          </div>
        )}
      </div>
    </div>
  );
};

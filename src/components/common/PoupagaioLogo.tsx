import React from 'react';

interface PoupagaioLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSlogan?: boolean;
  className?: string;
  onClick?: () => void;
}

export const PoupagaioLogo: React.FC<PoupagaioLogoProps> = ({
  size = 'md',
  showSlogan = false,
  className = '',
  onClick,
}) => {
  const sizeMap = {
    sm: { img: 'w-7 h-7', title: 'text-base font-bold', slogan: 'text-[10px]' },
    md: { img: 'w-10 h-10', title: 'text-xl font-extrabold', slogan: 'text-xs' },
    lg: { img: 'w-14 h-14', title: 'text-2xl font-black', slogan: 'text-sm' },
    xl: { img: 'w-20 h-20', title: 'text-3xl font-black', slogan: 'text-base' },
  };

  const current = sizeMap[size];

  return (
    <div
      id="poupagaio-brand-logo"
      onClick={onClick}
      className={`flex items-center gap-3 select-none ${onClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''} ${className}`}
    >
      <div className="relative shrink-0 flex items-center justify-center">
        <img
          src="/logo-poupagaio.png"
          alt="Papagaio verde segurando moeda de ouro - Mascote oficial Poupagaio"
          referrerPolicy="no-referrer"
          className={`${current.img} object-contain rounded-xl drop-shadow-sm`}
        />
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className={`${current.title} tracking-tight text-[#0D3B22]`}>
            Poupa<span className="text-[#22C55E]">gaio</span>
          </span>
        </div>
        {showSlogan && (
          <span className={`${current.slogan} text-[#68736C] font-medium leading-tight`}>
            Organize hoje. Voe mais longe.
          </span>
        )}
      </div>
    </div>
  );
};

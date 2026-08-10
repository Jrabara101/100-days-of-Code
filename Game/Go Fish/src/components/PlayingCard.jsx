import React, { memo } from 'react';

export const PlayingCard = memo(({ 
  card, 
  isFaceDown = false, 
  onClick, 
  isSelected = false,
  disabled = false,
  size = 'md' // 'sm', 'md', 'lg'
}) => {
  if (isFaceDown) {
    return (
      <div 
        className={`bg-gb-lightest border-4 border-black rounded-none shadow-pixel relative overflow-hidden flex items-center justify-center select-none ${
          size === 'sm' ? 'w-10 h-14' : size === 'lg' ? 'w-20 h-28' : 'w-14 h-20'
        }`}
      >
        {/* Retro GameBoy / NES Card Back Texture Pattern */}
        <div 
          className="absolute inset-1 bg-gb-dark border border-gb-darkest flex items-center justify-center opacity-80"
          style={{
            backgroundImage: `radial-gradient(#1f2219 2px, transparent 2px)`,
            backgroundSize: '6px 6px'
          }}
        >
          <div className="w-4 h-4 border-2 border-gb-lightest rotate-45 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-gb-lightest"></div>
          </div>
        </div>
      </div>
    );
  }

  const suitColor = card.isRed ? 'text-nes-red' : 'text-black';
  const sizeClasses = size === 'sm' 
    ? 'w-10 h-14 p-0.5 text-xs' 
    : size === 'lg' 
      ? 'w-20 h-28 p-1 text-base' 
      : 'w-16 h-24 p-1 text-sm';

  return (
    <div 
      onClick={() => !disabled && onClick && onClick(card.rank)}
      className={`bg-white border-4 border-black rounded-none flex flex-col justify-between shadow-pixel select-none transition-all duration-150 ${sizeClasses} ${
        disabled 
          ? 'cursor-not-allowed opacity-80' 
          : 'cursor-pointer hover:-translate-y-2 hover:shadow-pixel-lg'
      } ${isSelected ? 'ring-4 ring-nes-yellow -translate-y-3 bg-yellow-50' : ''}`}
    >
      {/* Top Left Rank & Suit */}
      <div className={`font-black leading-none flex items-center gap-0.5 ${suitColor}`}>
        <span>{card.rank}</span>
        <span className="text-[10px]">{card.suit}</span>
      </div>

      {/* Center Suit Symbol */}
      <div className={`text-2xl font-black text-center ${suitColor}`}>
        {card.suit}
      </div>

      {/* Bottom Right Inverted Rank */}
      <div className={`font-black leading-none self-end rotate-180 flex items-center gap-0.5 ${suitColor}`}>
        <span>{card.rank}</span>
        <span className="text-[10px]">{card.suit}</span>
      </div>
    </div>
  );
});

import React from 'react';

interface AmountDisplayProps {
  amountCents: number;
  originalAmountCents?: number;
  originalCurrency?: string;
  fxRate?: number;
  currency?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showFxDetails?: boolean;
}

export const AmountDisplay: React.FC<AmountDisplayProps> = ({
  amountCents,
  originalAmountCents,
  originalCurrency = 'USD',
  fxRate = 1.0,
  currency = '$',
  className = '',
  size = 'md',
  showFxDetails = false,
}) => {
  const dollars = (amountCents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm font-medium',
    lg: 'text-lg font-semibold',
    xl: 'text-2xl font-bold tracking-tight',
  }[size];

  const hasFx = originalCurrency !== 'USD' && fxRate !== 1.0 && originalAmountCents;
  const originalFormatted = originalAmountCents
    ? (originalAmountCents / 100).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : null;

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <div className={`font-mono tabular-nums flex items-baseline gap-0.5 ${sizeClasses}`}>
        <span className="text-gray-400 font-sans text-[0.85em]">{currency}</span>
        <span>{dollars}</span>
      </div>

      {hasFx && (
        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono mt-0.5">
          <span className="px-1 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            FX
          </span>
          <span>
            {originalFormatted} {originalCurrency}
          </span>
          {showFxDetails && (
            <span className="text-gray-500">(@ {fxRate.toFixed(4)})</span>
          )}
        </div>
      )}
    </div>
  );
};

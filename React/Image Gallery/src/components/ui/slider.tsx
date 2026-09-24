import React from 'react';

export interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  unit?: string;
  showValue?: boolean;
}

export const Slider: React.FC<SliderProps> = ({
  className = '',
  label,
  unit = '',
  showValue = true,
  value,
  min = 100,
  max = 400,
  ...props
}) => {
  const numVal = Number(value);
  const minVal = Number(min);
  const maxVal = Number(max);
  const percent = ((numVal - minVal) / (maxVal - minVal)) * 100;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {label && (
        <span className="text-xs text-outline font-medium select-none">{label}</span>
      )}
      <div className="relative flex items-center flex-1">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          className="w-full h-1 bg-surface-container-highest rounded-full cursor-pointer appearance-none outline-none accent-primary-container"
          style={{
            background: `linear-gradient(to right, #38bdf8 ${percent}%, #2a2a2c ${percent}%)`,
          }}
          {...props}
        />
      </div>
      {showValue && (
        <span className="font-mono-data text-xs text-primary font-semibold min-w-[3.5ch] text-right">
          {value}
          {unit}
        </span>
      )}
    </div>
  );
};

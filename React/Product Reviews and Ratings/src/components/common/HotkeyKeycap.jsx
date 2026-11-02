import React from 'react';

/**
 * HotkeyKeycap
 * Crisp monospaced shortcut indicator following Hollis Console specifications.
 */
export function HotkeyKeycap({ char, label = null, className = '', variant = 'default' }) {
  let styleClasses = 'bg-surface-container-low border border-outline-variant/60 text-outline';
  if (variant === 'active') {
    styleClasses = 'bg-primary text-white border-primary shadow-sm';
  } else if (variant === 'amber') {
    styleClasses = 'bg-amber-800 text-white border-amber-900';
  } else if (variant === 'error') {
    styleClasses = 'bg-error-container text-on-error-container border-error/30';
  }

  return (
    <span className={`inline-flex items-center gap-1 select-none ${className}`}>
      <kbd
        className={`font-mono text-label-hotkey px-1.5 py-0.5 rounded leading-none ${styleClasses}`}
      >
        {char}
      </kbd>
      {label && <span className="text-body-sm text-on-surface-variant ml-0.5">{label}</span>}
    </span>
  );
}


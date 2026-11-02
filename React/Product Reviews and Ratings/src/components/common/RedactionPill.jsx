import React from 'react';

/**
 * RedactionPill
 * Public sanitized token capsule rendered inline with review body.
 * Formats:
 * - [Address redacted]
 * - [•••-•••-0194]
 * - [Health claim removed]
 * - [Link redacted]
 */
export function RedactionPill({ type = 'address', text }) {
  let icon = 'lock';
  if (type === 'phone') icon = 'phonelink_lock';
  if (type === 'claim' || type === 'health') icon = 'shield';
  if (type === 'link') icon = 'link_off';

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-mono text-label-code-sm align-middle mx-1 shadow-xs border border-outline-variant/30 select-none">
      <span className="material-symbols-outlined text-[13px] text-outline">{icon}</span>
      <span className="font-medium">{text}</span>
    </span>
  );
}

/**
 * Helper to render body text with inline redaction capsules
 */
export function renderSanitizedText(text) {
  if (!text) return null;

  // Split on pattern brackets like [Address redacted] or [•••-•••-0194] or [Health claim removed] or [Link redacted]
  const regex = /(\[[^\]]+\])/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.startsWith('[') && part.endsWith(']')) {
      const inner = part.slice(1, -1);
      let type = 'general';
      if (inner.toLowerCase().includes('address')) type = 'address';
      else if (inner.includes('•') || inner.toLowerCase().includes('phone')) type = 'phone';
      else if (inner.toLowerCase().includes('health') || inner.toLowerCase().includes('claim')) type = 'claim';
      else if (inner.toLowerCase().includes('link')) type = 'link';

      return <RedactionPill key={index} type={type} text={part} />;
    }
    return <span key={index}>{part}</span>;
  });
}


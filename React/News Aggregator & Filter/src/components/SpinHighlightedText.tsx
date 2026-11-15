import React from 'react';

interface SpinHighlightedTextProps {
  text: string;
  loadedWords: string[];
  enabled: boolean;
}

export const SpinHighlightedText: React.FC<SpinHighlightedTextProps> = ({
  text,
  loadedWords,
  enabled,
}) => {
  if (!enabled || loadedWords.length === 0) {
    return <span>{text}</span>;
  }

  const escaped = loadedWords
    .filter(Boolean)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (escaped.length === 0) return <span>{text}</span>;

  const regex = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, idx) => {
        const isSpin = loadedWords.some(
          (w) => w.toLowerCase() === part.toLowerCase()
        );
        if (isSpin) {
          return (
            <mark
              key={idx}
              className="spin-word text-ink-primary"
              title="Loaded framing adjective highlighted"
            >
              {part}
            </mark>
          );
        }
        return <React.Fragment key={idx}>{part}</React.Fragment>;
      })}
    </span>
  );
};


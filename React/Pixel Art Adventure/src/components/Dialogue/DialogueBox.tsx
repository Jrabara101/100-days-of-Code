import React, { useState, useEffect, useRef } from 'react';
import { DialogueNode, DialogueChoice } from '../../types/game';
import { pixelSprites } from '../../game/sprites';
import { audioEngine } from '../../services/audio';

interface DialogueBoxProps {
  dialogue: DialogueNode;
  narrativeFlags: Record<string, any>;
  onSelectChoice: (choice: DialogueChoice) => void;
  onClose: () => void;
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({
  dialogue,
  narrativeFlags,
  onSelectChoice,
  onClose,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState(0);

  // Filter available choices based on requiredFlags
  const availableChoices = dialogue.choices.filter((choice) => {
    if (!choice.requiredFlags || choice.requiredFlags.length === 0) return true;
    return choice.requiredFlags.every((flag) => Boolean(narrativeFlags[flag]));
  });

  // Typewriter effect ref
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    setSelectedChoiceIndex(0);

    let charIndex = 0;
    const fullText = dialogue.text;

    const typeNextChar = () => {
      if (charIndex < fullText.length) {
        charIndex++;
        setDisplayedText(fullText.slice(0, charIndex));

        // Pitch-modulated typewriter blip (skip spaces/punctuation)
        if (fullText[charIndex - 1] !== ' ' && charIndex % 2 === 0) {
          audioEngine.playDialogueChirp(dialogue.voiceType || 'player');
        }

        timerRef.current = window.setTimeout(typeNextChar, 24); // 24ms per char
      } else {
        setIsTyping(false);
      }
    };

    timerRef.current = window.setTimeout(typeNextChar, 100);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [dialogue.id]);

  // Fast-forward text if user clicks text or presses Space/Enter while typing
  const handleSkipTyping = () => {
    if (isTyping) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setDisplayedText(dialogue.text);
      setIsTyping(false);
    }
  };

  // Keyboard navigation for choices ([1], [2], [3], Arrows, Enter)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTyping) {
        if (e.code === 'Space' || e.code === 'Enter') {
          handleSkipTyping();
        }
        return;
      }

      // Numeric hotkeys 1..9
      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= availableChoices.length) {
        e.preventDefault();
        audioEngine.playChoiceSelect();
        onSelectChoice(availableChoices[num - 1]);
        return;
      }

      // Arrow navigation
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        setSelectedChoiceIndex((prev) => (prev + 1) % availableChoices.length);
        audioEngine.playDialogueChirp('player');
      } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        setSelectedChoiceIndex((prev) => (prev - 1 + availableChoices.length) % availableChoices.length);
        audioEngine.playDialogueChirp('player');
      } else if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        if (availableChoices[selectedChoiceIndex]) {
          audioEngine.playChoiceSelect();
          onSelectChoice(availableChoices[selectedChoiceIndex]);
        }
      } else if (e.code === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isTyping, availableChoices, selectedChoiceIndex, onSelectChoice, onClose]);

  // Generate crisp pixel portrait
  const portraitUrl = pixelSprites.getPortraitDataUrl(
    (dialogue.portraitUrl as any) || 'elder'
  );

  return (
    <div className="absolute inset-x-0 bottom-8 flex justify-center px-4 z-30 pointer-events-auto">
      <div
        onClick={handleSkipTyping}
        className="relative w-full max-w-[760px] p-5 rounded-lg bg-[#131826]/95 border-2 border-[#2D3954] backdrop-blur-md shadow-2xl flex flex-col md:flex-row gap-5"
      >
        {/* Left: Pixel Portrait Frame with subtle breathing animation */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="relative w-20 h-20 rounded-md bg-[#0B0D14] border-2 border-[#2D3954] overflow-hidden shadow-inner animate-breath flex items-center justify-center">
            <img
              src={portraitUrl}
              alt={dialogue.speaker}
              className="w-full h-full object-cover pixelated"
            />
            {/* Golden corner accents */}
            <div className="absolute top-0 left-0 w-1.5 h-1.5 bg-[#F59E0B]" />
            <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-[#F59E0B]" />
            <div className="absolute bottom-0 left-0 w-1.5 h-1.5 bg-[#F59E0B]" />
            <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-[#F59E0B]" />
          </div>

          <span className="font-pixel text-[9px] text-[#F59E0B] mt-2 text-center tracking-wider uppercase max-w-[90px] truncate">
            {dialogue.speaker}
          </span>
        </div>

        {/* Center-Right: Speaker Nameplate, Prose Box, Choices Dock */}
        <div className="flex flex-col justify-between flex-grow min-h-[110px]">
          <div>
            {/* Speaker Nameplate & Role */}
            <div className="flex items-center gap-2 mb-2">
              <span className="font-story font-bold text-sm text-[#F8FAFC] tracking-wide">
                {dialogue.speaker}
              </span>
              {dialogue.speakerRole && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#1E293B] text-[#94A3B8] border border-[#2D3954]">
                  {dialogue.speakerRole}
                </span>
              )}
            </div>

            {/* Typewriter Prose Text */}
            <p className="font-story text-sm text-[#CBD5E1] leading-relaxed min-h-[48px]">
              {displayedText}
              {isTyping && (
                <span className="inline-block w-2 h-4 bg-[#F59E0B] ml-1 animate-pulse align-middle" />
              )}
            </p>
          </div>

          {/* Interactive Choice Selection Buttons */}
          <div className="mt-4 flex flex-col gap-2">
            {!isTyping && availableChoices.length > 0 ? (
              availableChoices.map((choice, idx) => {
                const isSelected = idx === selectedChoiceIndex;
                return (
                  <button
                    key={choice.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      audioEngine.playChoiceSelect();
                      onSelectChoice(choice);
                    }}
                    onMouseEnter={() => setSelectedChoiceIndex(idx)}
                    className={`group flex items-center justify-between w-full px-3.5 py-2 rounded text-left text-xs font-story transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1E293B] border-2 border-[#F59E0B] text-[#F8FAFC] translate-x-1 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                        : 'bg-[#0B0D14]/80 border border-[#2D3954] text-[#CBD5E1] hover:border-[#475569] hover:bg-[#1E293B]/70'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-pixel text-[10px] text-[#F59E0B]">
                        {isSelected ? '►' : `[${idx + 1}]`}
                      </span>
                      <span className="font-medium">{choice.text}</span>
                    </div>

                    <span className="font-mono text-[10px] text-[#64748B] group-hover:text-[#94A3B8]">
                      Enter ↵
                    </span>
                  </button>
                );
              })
            ) : !isTyping ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="self-end px-3.5 py-1.5 rounded bg-[#1E293B] hover:bg-[#2D3954] text-xs font-story text-[#F8FAFC] border border-[#2D3954] transition cursor-pointer"
              >
                Close [ESC]
              </button>
            ) : (
              <span className="text-[10px] text-[#64748B] font-mono italic">
                Press [Space] or click to fast-forward...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

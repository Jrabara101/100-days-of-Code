import React, { useState, useEffect, useRef } from 'react';
import { useDiscussion } from '../../context/DiscussionContext';
import { stanceDefinitions } from '../../data/initialComments';
import { checkAlreadyAnswered, analyzeTone } from '../../services/toneAnalyzer';
import { 
  Send, 
  X, 
  Quote, 
  Sparkles, 
  Lightbulb, 
  AlertTriangle, 
  Check, 
  Bold, 
  Italic, 
  Code,
  CornerDownRight
} from 'lucide-react';

export default function SmartComposer({ defaultParentId = null }) {
  const { 
    addComment, 
    activeQuoteAnchor, 
    setActiveQuoteAnchor,
    jumpToComment
  } = useDiscussion();

  const [bodyText, setBodyText] = useState('');
  const [selectedStance, setSelectedStance] = useState('building');
  const [alreadyAnsweredHint, setAlreadyAnsweredHint] = useState(null);
  const [toneWarning, setToneWarning] = useState(null);
  const [isFocused, setIsFocused] = useState(false);

  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(90, textareaRef.current.scrollHeight)}px`;
    }
  }, [bodyText]);

  // Debounced check for "Already Answered" and tone analysis
  useEffect(() => {
    const timer = setTimeout(() => {
      const answeredMatch = checkAlreadyAnswered(bodyText);
      setAlreadyAnsweredHint(answeredMatch);

      const toneResult = analyzeTone(bodyText);
      if (toneResult.isHeated) {
        setToneWarning(toneResult);
      } else {
        setToneWarning(null);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [bodyText]);

  const handleApplyReframing = () => {
    if (toneWarning && toneWarning.suggestedReframing) {
      setBodyText(toneWarning.suggestedReframing);
      setSelectedStance('counterpoint');
      setToneWarning(null);
    }
  };

  const handleInsertMarkdown = (syntax) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = bodyText.substring(start, end);

    let replacement = '';
    if (syntax === 'bold') replacement = `**${selected || 'bold text'}**`;
    if (syntax === 'italic') replacement = `*${selected || 'italic text'}*`;
    if (syntax === 'code') replacement = `\`${selected || 'code'}\``;
    if (syntax === 'quote') replacement = `> ${selected || 'quoted passage'}\n`;

    const nextText = bodyText.substring(0, start) + replacement + bodyText.substring(end);
    setBodyText(nextText);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!bodyText.trim()) return;

    addComment({
      parentId: defaultParentId,
      paragraphId: activeQuoteAnchor?.paragraphId || null,
      quotedText: activeQuoteAnchor?.text || null,
      body: bodyText.trim(),
      stance: selectedStance
    });

    setBodyText('');
    setAlreadyAnsweredHint(null);
    setToneWarning(null);
  };

  return (
    <div className={`w-full rounded-2xl border transition-all duration-300 p-5 bg-salon-card ${
      isFocused ? 'ring-2 ring-indigo-500/80 border-transparent shadow-lg' : 'border-salon-border shadow-sm'
    }`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Top: Active Quoted Passage Anchor (if reader highlighted text in article) */}
        {activeQuoteAnchor && (
          <div className="relative p-3.5 rounded-xl bg-amber-500/[0.06] border-l-3 border-amber-500 text-xs text-salon-ink-primary animate-fade-in">
            <div className="flex items-center justify-between font-semibold text-amber-800 dark:text-amber-300 mb-1">
              <span className="flex items-center gap-1.5">
                <Quote className="w-3.5 h-3.5" />
                <span>Anchored to {activeQuoteAnchor.paragraphId?.toUpperCase() || 'Selection'}</span>
              </span>
              <button
                type="button"
                onClick={() => setActiveQuoteAnchor(null)}
                className="text-salon-ink-muted hover:text-salon-ink-primary p-0.5 rounded"
                title="Remove quote anchor"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="font-serif italic text-salon-ink-secondary leading-relaxed">
              "{activeQuoteAnchor.text}"
            </p>
          </div>
        )}

        {/* Stance Selector Strip (Intent Architecture) */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-salon-ink-muted mb-2">
            Select Your Intent & Stance Tag:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(stanceDefinitions).map(([key, def]) => {
              const isSelected = selectedStance === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedStance(key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all select-none border ${
                    isSelected
                      ? `${def.bgClass} shadow-sm ring-1 ring-black/10 dark:ring-white/10 scale-102`
                      : 'bg-salon-nested/70 hover:bg-salon-nested border-salon-border text-salon-ink-secondary hover:text-salon-ink-primary'
                  }`}
                >
                  <span>{def.icon}</span>
                  <span>{def.label}</span>
                  {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* "Already Answered?" Pre-Post Helper Card */}
        {alreadyAnsweredHint && (
          <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs animate-fade-in flex items-start gap-2.5">
            <Lightbulb className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold text-indigo-900 dark:text-indigo-200 block">
                Already Addressed by Author:
              </span>
              <p className="text-indigo-800 dark:text-indigo-300 mt-0.5">
                {alreadyAnsweredHint.advice}
              </p>
              <button
                type="button"
                onClick={() => jumpToComment(alreadyAnsweredHint.commentId)}
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <span>Read Dr. Vance's response</span>
                <CornerDownRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Graceful "Cool-Down" & Tone Mirror Card */}
        {toneWarning && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs animate-fade-in flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold text-rose-900 dark:text-rose-200 block">
                Graceful Cool-Down ({toneWarning.reason}):
              </span>
              <p className="text-rose-800 dark:text-rose-300 mt-0.5">
                High emotional friction tends to trigger defensive reactions. Would you like to reframe as a constructive counterpoint?
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleApplyReframing}
                  className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[11px] transition-colors"
                >
                  Apply Constructive Reframe
                </button>
                <button
                  type="button"
                  onClick={() => setToneWarning(null)}
                  className="px-2 py-1 text-rose-700 dark:text-rose-300 hover:underline text-[11px]"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Textarea for Comment Draft */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            rows={3}
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Contribute a constructive insight, counter-example, or question for the author..."
            className="w-full text-sm leading-relaxed p-4 rounded-xl border border-salon-border bg-salon-nested dark:bg-zinc-900/80 text-salon-ink-primary placeholder:text-salon-ink-muted focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-salon-card dark:focus:bg-zinc-900 transition-all resize-none"
          />
        </div>

        {/* Action Bar: Markdown Controls, Character Counter, Submit Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Markdown Formatting Micro-Buttons */}
          <div className="flex items-center gap-1 text-salon-ink-muted">
            <button
              type="button"
              onClick={() => handleInsertMarkdown('bold')}
              className="p-1.5 rounded hover:bg-salon-nested hover:text-salon-ink-primary transition-colors"
              title="Bold (**text**)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleInsertMarkdown('italic')}
              className="p-1.5 rounded hover:bg-salon-nested hover:text-salon-ink-primary transition-colors"
              title="Italic (*text*)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleInsertMarkdown('code')}
              className="p-1.5 rounded hover:bg-salon-nested hover:text-salon-ink-primary transition-colors"
              title="Code (`code`)"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleInsertMarkdown('quote')}
              className="p-1.5 rounded hover:bg-salon-nested hover:text-salon-ink-primary transition-colors"
              title="Quote block (> quote)"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right: Character count & Submit */}
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-salon-ink-muted">
              {bodyText.length} chars
            </span>

            <button
              type="submit"
              disabled={!bodyText.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold text-xs shadow-md transition-all active:scale-95"
            >
              <span>Post to Discussion</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  Image,
  Layers,
  Eye,
  Sliders,
  Star,
  CornerDownLeft
} from 'lucide-react';
import { pipeVariables } from '../../utils/variablePiping';

export default function CanvasEditor({
  question,
  onUpdateQuestion,
  surveyQuestions = [],
  onPreviewQuestion,
  isQuiz = false,
  viewportMode = 'desktop' // 'desktop' | 'mobile'
}) {
  if (!question) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 font-mono text-sm">
        Select a question from the outline to edit
      </div>
    );
  }

  const choices = question.properties?.choices || [];

  // Update choice label
  const handleChoiceChange = (choiceIndex, newLabel) => {
    const updatedChoices = [...choices];
    updatedChoices[choiceIndex] = { ...updatedChoices[choiceIndex], label: newLabel };
    onUpdateQuestion({
      ...question,
      properties: { ...question.properties, choices: updatedChoices }
    });
  };

  // Add new choice (e.g. on Enter key)
  const handleAddChoice = (afterIndex = null) => {
    const newChoice = {
      id: 'c_' + Math.random().toString(36).substr(2, 6),
      label: `Option ${choices.length + 1}`
    };
    let updatedChoices;
    if (afterIndex !== null) {
      updatedChoices = [...choices];
      updatedChoices.splice(afterIndex + 1, 0, newChoice);
    } else {
      updatedChoices = [...choices, newChoice];
    }

    onUpdateQuestion({
      ...question,
      properties: { ...question.properties, choices: updatedChoices }
    });
  };

  // Remove choice
  const handleRemoveChoice = (choiceIndex) => {
    if (choices.length <= 1) return;
    const updatedChoices = choices.filter((_, idx) => idx !== choiceIndex);
    onUpdateQuestion({
      ...question,
      properties: { ...question.properties, choices: updatedChoices }
    });
  };

  // Handle Enter key inside choice to spawn next choice
  const handleChoiceKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddChoice(index);
    }
  };

  // Available variable names for piping
  const availableVariables = surveyQuestions
    .map(q => q.properties?.variable_name)
    .filter(Boolean);

  const insertVariable = (varName) => {
    onUpdateQuestion({
      ...question,
      title: `${question.title} {{${varName}}}`
    });
  };

  return (
    <div className="flex-1 bg-[#0A0B0E] flex flex-col items-center justify-center p-6 overflow-y-auto relative">
      {/* Floating Canvas Action Bar */}
      <div className="sticky top-4 z-20 flex items-center gap-2 p-1.5 rounded-xl border border-white/10 bg-[#121418]/90 backdrop-blur-md shadow-elevated mb-6">
        <span className="font-mono text-xs px-2.5 py-1 text-brand-light font-bold">
          Live Studio Canvas
        </span>
        <div className="w-[1px] h-4 bg-white/10" />
        <button
          type="button"
          onClick={() => onPreviewQuestion(question.id)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Test Runner</span>
        </button>
      </div>

      {/* Editor Surface Wrapper (Desktop vs Mobile simulator) */}
      <div
        className={`w-full transition-all duration-300 flex flex-col justify-center ${
          viewportMode === 'mobile'
            ? 'max-w-sm border-2 border-white/20 rounded-[36px] p-6 bg-[#0E1015] shadow-2xl min-h-[640px]'
            : 'max-w-2xl px-4 py-8'
        }`}
      >
        {/* Question Index Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="font-mono text-xs font-bold text-brand bg-brand/10 border border-brand/20 px-2.5 py-0.5 rounded">
            {String(question.order_index || 1).padStart(2, '0')} →
          </span>
          {question.is_required && (
            <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider">
              * Required
            </span>
          )}
        </div>

        {/* Click-to-edit Question Title */}
        <div className="relative group mb-3">
          <textarea
            rows={2}
            value={question.title}
            onChange={(e) => onUpdateQuestion({ ...question, title: e.target.value })}
            placeholder="Type your question prompt here..."
            className="w-full bg-transparent text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug border-b border-transparent hover:border-white/20 focus:border-brand outline-none transition-all resize-none p-1 rounded"
          />
          {/* Variable piping insert pills */}
          {availableVariables.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-[11px] text-slate-400 font-mono">Insert variable:</span>
              {availableVariables.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => insertVariable(v)}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand/15 text-brand-light border border-brand/30 hover:bg-brand hover:text-white transition-colors"
                >
                  +{`{{${v}}}`}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Subtitle helper input */}
        <div className="mb-8">
          <input
            type="text"
            value={question.subtitle || ''}
            onChange={(e) => onUpdateQuestion({ ...question, subtitle: e.target.value })}
            placeholder="Add an optional descriptive subtitle or helper instructions..."
            className="w-full bg-transparent text-sm text-slate-400 border-b border-transparent hover:border-white/20 focus:border-brand/60 outline-none transition-all p-1"
          />
        </div>

        {/* Polymorphic Interactive Body */}
        {/* Multiple Choice Editor */}
        {question.type === 'multiple_choice' && (
          <div className="space-y-3 w-full">
            {choices.map((choice, index) => {
              const keyLetter = String.fromCharCode(65 + index);
              const isCorrect = choice.label === question.properties?.correct_answer;

              return (
                <div
                  key={choice.id || index}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-white/10 bg-[#121418] hover:border-white/20 transition-all group"
                >
                  <span className="flex items-center justify-center w-7 h-7 rounded-md font-mono text-xs font-bold bg-white/5 border border-white/10 text-slate-300">
                    {keyLetter}
                  </span>
                  <input
                    type="text"
                    value={choice.label}
                    onChange={(e) => handleChoiceChange(index, e.target.value)}
                    onKeyDown={(e) => handleChoiceKeyDown(e, index)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 bg-transparent text-sm font-medium text-white outline-none"
                  />

                  {/* Scored Quiz Mark as Correct */}
                  {isQuiz && (
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateQuestion({
                          ...question,
                          properties: { ...question.properties, correct_answer: choice.label }
                        });
                      }}
                      className={`text-xs px-2 py-1 rounded font-mono border transition-all ${
                        isCorrect
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
                          : 'text-slate-400 border-white/10 hover:border-emerald-500/50'
                      }`}
                      title="Set as correct answer"
                    >
                      {isCorrect ? '✓ Correct Answer' : 'Mark Correct'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveChoice(index)}
                    disabled={choices.length <= 1}
                    className="p-1 rounded text-slate-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 disabled:opacity-0 transition-opacity"
                    title="Remove choice"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => handleAddChoice()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-white/20 hover:border-brand text-xs font-semibold text-slate-400 hover:text-white transition-all w-full justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>Add Option (or press Enter on option above)</span>
            </button>
          </div>
        )}

        {/* Picture Choice Editor */}
        {question.type === 'picture_choice' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {choices.map((choice, index) => {
              const keyLetter = String.fromCharCode(65 + index);
              return (
                <div
                  key={choice.id || index}
                  className="rounded-xl border border-white/10 bg-[#121418] overflow-hidden p-3 space-y-2"
                >
                  <div className="relative h-28 bg-black/40 rounded-lg overflow-hidden flex items-center justify-center">
                    {choice.image_url ? (
                      <img src={choice.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Image className="w-8 h-8 text-slate-600" />
                    )}
                    <span className="absolute top-2 left-2 flex items-center justify-center w-5 h-5 rounded font-mono text-[10px] font-bold bg-black/70 text-white border border-white/20">
                      {keyLetter}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={choice.label}
                    onChange={(e) => handleChoiceChange(index, e.target.value)}
                    placeholder="Choice label"
                    className="w-full bg-transparent text-xs font-semibold text-white border-b border-white/10 outline-none pb-1"
                  />
                  <input
                    type="text"
                    value={choice.image_url || ''}
                    onChange={(e) => {
                      const updated = [...choices];
                      updated[index] = { ...updated[index], image_url: e.target.value };
                      onUpdateQuestion({
                        ...question,
                        properties: { ...question.properties, choices: updated }
                      });
                    }}
                    placeholder="Image URL (Unsplash, etc.)"
                    className="w-full bg-transparent text-[11px] font-mono text-slate-400 border-b border-transparent focus:border-brand outline-none"
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Short Text Preview */}
        {['short_text', 'email', 'phone'].includes(question.type) && (
          <div className="w-full py-4 border-b-2 border-white/20 text-slate-500 text-xl font-sans">
            {question.properties?.placeholder || 'Respondent text will be entered here...'}
          </div>
        )}

        {/* Long Text Preview */}
        {question.type === 'long_text' && (
          <div className="w-full p-4 rounded-xl border border-white/10 bg-[#121418] text-slate-500 text-sm min-h-[90px]">
            {question.properties?.placeholder || 'Respondent multi-line thoughts will be entered here...'}
          </div>
        )}

        {/* Opinion Scale Preview */}
        {question.type === 'opinion_scale' && (
          <div className="w-full space-y-3">
            <div className="flex gap-1.5 justify-between">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <div key={n} className="flex-1 py-3 text-center border border-white/10 rounded-lg bg-[#121418] font-mono text-sm text-slate-300">
                  {n}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate-400 font-medium">
              <span>{question.properties?.min_label || 'Not likely'}</span>
              <span>{question.properties?.max_label || 'Extremely likely'}</span>
            </div>
          </div>
        )}

        {/* Rating Stars Preview */}
        {question.type === 'rating' && (
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map(s => (
              <div key={s} className="p-3 rounded-xl border border-white/10 bg-[#121418] text-amber-400">
                <Star className="w-7 h-7 fill-amber-400/40" />
              </div>
            ))}
          </div>
        )}

        {/* File Upload Preview */}
        {question.type === 'file_upload' && (
          <div className="border-2 border-dashed border-white/15 rounded-2xl p-6 text-center bg-[#121418] text-slate-400 text-xs">
            Drag & drop file upload zone for respondents
          </div>
        )}
      </div>
    </div>
  );
}
